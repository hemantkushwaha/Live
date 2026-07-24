import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { PrivateCallRequest } from '../../shared/types';
import { SOCKET_EVENTS } from '../../shared/events';
import { privateRequestClient } from '../services/privateRequestClient';
import { useAuth } from '../contexts/AuthContext';

interface UsePrivateRequestsOptions {
  streamId?: string;
  isStreamer?: boolean;
  socket?: Socket | null;
}

export function usePrivateRequests({ streamId, isStreamer = false, socket }: UsePrivateRequestsOptions) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PrivateCallRequest[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PrivateCallRequest | null>(null);
  const [requestStatus, setRequestStatus] = useState<'Pending' | 'Accepted' | 'Rejected' | 'Expired' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of socket reference
  const socketRef = useRef<Socket | null | undefined>(socket);
  socketRef.current = socket;

  // Fetch initial requests
  const refreshRequests = useCallback(async () => {
    if (!streamId || !user) return;
    try {
      setIsLoading(true);
      setError(null);
      const fetched = await privateRequestClient.getRequests(streamId);
      
      const pendingOnly = fetched.filter((r) => r.status === 'Pending' || r.status === 'pending');
      setRequests(pendingOnly);

      if (!isStreamer) {
        const myPending = pendingOnly.find((r) => r.viewerId === user.id);
        if (myPending) {
          setPendingRequest(myPending);
          setRequestStatus('Pending');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  }, [streamId, user, isStreamer]);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  // Subscribe to socket events for real-time updates
  useEffect(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket) return;

    const handleReceived = (data: { request: PrivateCallRequest }) => {
      const req = data?.request;
      if (!req) return;

      if (streamId && req.streamId !== streamId) return;

      if (req.status === 'Pending' || req.status === 'pending') {
        setRequests((prev) => {
          if (prev.some((r) => r.id === req.id)) return prev;
          return [...prev, req];
        });

        if (user && req.viewerId === user.id) {
          setPendingRequest(req);
          setRequestStatus('Pending');
        }
      }
    };

    const handleUpdated = (data: { request: PrivateCallRequest }) => {
      const req = data?.request;
      if (!req) return;

      if (streamId && req.streamId !== streamId) return;

      if (req.status !== 'Pending' && req.status !== 'pending') {
        // Removed from pending list
        setRequests((prev) => prev.filter((r) => r.id !== req.id));

        if (user && req.viewerId === user.id) {
          setPendingRequest(req);
          if (req.status === 'Accepted' || req.status === 'accepted') setRequestStatus('Accepted');
          else if (req.status === 'Rejected' || req.status === 'rejected') setRequestStatus('Rejected');
          else if (req.status === 'Expired' || req.status === 'expired') setRequestStatus('Expired');
        }
      } else {
        setRequests((prev) => {
          const exists = prev.some((r) => r.id === req.id);
          if (exists) {
            return prev.map((r) => (r.id === req.id ? req : r));
          }
          return [...prev, req];
        });

        if (user && req.viewerId === user.id) {
          setPendingRequest(req);
          setRequestStatus('Pending');
        }
      }
    };

    const handleAccepted = (data: { request: PrivateCallRequest; requestId?: string }) => {
      const req = data?.request;
      const reqId = req?.id || data?.requestId;

      if (reqId) {
        setRequests((prev) => prev.filter((r) => r.id !== reqId));
      }

      if (user && req && req.viewerId === user.id) {
        setPendingRequest(req);
        setRequestStatus('Accepted');
      }
    };

    const handleRejected = (data: { request: PrivateCallRequest; requestId?: string }) => {
      const req = data?.request;
      const reqId = req?.id || data?.requestId;

      if (reqId) {
        setRequests((prev) => prev.filter((r) => r.id !== reqId));
      }

      if (user && req && req.viewerId === user.id) {
        setPendingRequest(req);
        setRequestStatus('Rejected');
      }
    };

    const handleQueueUpdated = (data: { streamId?: string; requests?: PrivateCallRequest[] }) => {
      if (streamId && data.streamId && data.streamId !== streamId) return;
      if (Array.isArray(data.requests)) {
        setRequests(data.requests.filter((r) => r.status === 'Pending' || r.status === 'pending'));
      }
    };

    const handleExpired = (data: { requestId: string; request?: PrivateCallRequest }) => {
      const reqId = data?.requestId || data?.request?.id;
      if (!reqId) return;

      setRequests((prev) => prev.filter((r) => r.id !== reqId));

      if (pendingRequest && pendingRequest.id === reqId) {
        setRequestStatus('Expired');
      }
    };

    activeSocket.on(SOCKET_EVENTS.PRIVATE_REQUEST_RECEIVED, handleReceived);
    activeSocket.on(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, handleUpdated);
    activeSocket.on(SOCKET_EVENTS.PRIVATE_ACCEPTED, handleAccepted);
    activeSocket.on(SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED, handleAccepted);
    activeSocket.on(SOCKET_EVENTS.PRIVATE_REJECTED, handleRejected);
    activeSocket.on(SOCKET_EVENTS.PRIVATE_CALL_REJECTED, handleRejected);
    activeSocket.on('private:queue-updated', handleQueueUpdated);
    activeSocket.on(SOCKET_EVENTS.PRIVATE_REQUEST_EXPIRED, handleExpired);

    return () => {
      activeSocket.off(SOCKET_EVENTS.PRIVATE_REQUEST_RECEIVED, handleReceived);
      activeSocket.off(SOCKET_EVENTS.PRIVATE_REQUEST_UPDATED, handleUpdated);
      activeSocket.off(SOCKET_EVENTS.PRIVATE_ACCEPTED, handleAccepted);
      activeSocket.off(SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED, handleAccepted);
      activeSocket.off(SOCKET_EVENTS.PRIVATE_REJECTED, handleRejected);
      activeSocket.off(SOCKET_EVENTS.PRIVATE_CALL_REJECTED, handleRejected);
      activeSocket.off('private:queue-updated', handleQueueUpdated);
      activeSocket.off(SOCKET_EVENTS.PRIVATE_REQUEST_EXPIRED, handleExpired);
    };
  }, [streamId, user, socket, pendingRequest]);

  // Send a new request (Viewer)
  const sendRequest = async (requestedDuration?: number) => {
    if (!streamId) throw new Error('No streamId provided');
    try {
      setIsLoading(true);
      setError(null);
      const request = await privateRequestClient.createRequest(streamId, requestedDuration);
      setPendingRequest(request);
      setRequestStatus('Pending');
      setRequests((prev) => [...prev.filter((r) => r.id !== request.id), request]);
      return request;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send private call request';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept a pending request (Creator)
  const acceptRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const accepted = await privateRequestClient.acceptRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      const activeSocket = socketRef.current;
      if (activeSocket) {
        console.log('[usePrivateRequests] Emitting private:start for accepted request:', requestId);
        activeSocket.emit(SOCKET_EVENTS.PRIVATE_START, { requestId });
      }

      return accepted;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to accept request';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Reject a pending request (Creator)
  const rejectRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const rejected = await privateRequestClient.rejectRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return rejected;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to reject request';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel an active request (Viewer or Streamer)
  const cancelRequest = async (requestIdToCancel?: string) => {
    const targetId = requestIdToCancel || pendingRequest?.id;
    if (!targetId) return;

    try {
      setIsLoading(true);
      setError(null);
      const cancelled = await privateRequestClient.cancelRequest(targetId);

      setRequests((prev) => prev.filter((r) => r.id !== targetId));
      if (pendingRequest && pendingRequest.id === targetId) {
        setPendingRequest(null);
        setRequestStatus(null);
      }
      return cancelled;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel request';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRequestState = () => {
    setPendingRequest(null);
    setRequestStatus(null);
    setError(null);
  };

  return {
    requests,
    pendingRequest,
    requestStatus,
    isLoading,
    error,
    clearError: () => setError(null),
    clearRequestState,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    refreshRequests,
  };
}
