import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Video, Mic, MicOff, VideoOff, PhoneOff, MessageSquare, ShieldAlert, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { StreamRoom, WebRTCSignalPayload, SOCKET_EVENTS } from '../types';
import { WebRTCManager } from '../services/webrtc';
import { VideoPlayer } from '../components/ui/VideoPlayer';

interface StreamPageProps {
  room: StreamRoom;
  isStreamer: boolean;
  onLeave: () => void;
}

export const StreamPage: React.FC<StreamPageProps> = ({ room, isStreamer, onLeave }) => {
  const { user } = useAuth();
  const { socket, stopStream, leaveStream, requestPrivateCall, activePrivateCall, endPrivateCall } = useSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const rtcManagerRef = useRef<WebRTCManager | null>(null);

  // Initialize WebRTC for Streamer or Viewer
  useEffect(() => {
    if (!socket) return;

    const rtc = new WebRTCManager({
      onRemoteTrack: (stream) => {
        setRemoteStream(stream);
      },
      onIceCandidate: (candidate) => {
        const targetUserId = activePrivateCall
          ? activePrivateCall.peerId
          : isStreamer
          ? room.viewers[0] // or targeted viewer
          : room.streamerId;

        if (targetUserId) {
          socket.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
            targetUserId,
            senderUserId: user?.id,
            candidate,
            context: activePrivateCall ? 'private_call' : 'broadcast',
          } as WebRTCSignalPayload);
        }
      },
    });

    rtcManagerRef.current = rtc;

    async function setupStream() {
      try {
        if (isStreamer || activePrivateCall) {
          const stream = await rtc.acquireLocalStream(true, true);
          setLocalStream(stream);

          // If streamer or in private call, create offer
          if (isStreamer && !activePrivateCall) {
            // Public stream offer creation logic for connected viewers
          }
        }
      } catch (err) {
        console.error('Error setting up WebRTC media:', err);
      }
    }

    setupStream();

    // Socket WebRTC Signal Listeners
    const handleOffer = async (payload: WebRTCSignalPayload) => {
      if (payload.sdp && rtcManagerRef.current) {
        const answer = await rtcManagerRef.current.handleOffer(payload.sdp);
        socket.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
          targetUserId: payload.senderUserId,
          senderUserId: user?.id,
          sdp: answer,
          context: payload.context,
        });
      }
    };

    const handleAnswer = async (payload: WebRTCSignalPayload) => {
      if (payload.sdp && rtcManagerRef.current) {
        await rtcManagerRef.current.handleAnswer(payload.sdp);
      }
    };

    const handleIceCandidate = async (payload: WebRTCSignalPayload) => {
      if (payload.candidate && rtcManagerRef.current) {
        await rtcManagerRef.current.addIceCandidate(payload.candidate);
      }
    };

    socket.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
    socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleIceCandidate);

    return () => {
      socket.off(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
      socket.off(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
      socket.off(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, handleIceCandidate);
      rtc.destroy();
    };
  }, [socket, isStreamer, activePrivateCall, room.streamerId, user?.id]);

  // Private 1-on-1 Call WebRTC Connection Initialization
  useEffect(() => {
    async function initPrivateCallWebRTC() {
      if (activePrivateCall && socket && rtcManagerRef.current) {
        try {
          const stream = await rtcManagerRef.current.acquireLocalStream(true, true);
          setLocalStream(stream);

          // Streamer initiates WebRTC Offer to Viewer
          if (isStreamer) {
            const offer = await rtcManagerRef.current.createOffer();
            socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
              targetUserId: activePrivateCall.peerId,
              senderUserId: user?.id,
              sdp: offer,
              context: 'private_call',
            });
          }
        } catch (err) {
          console.error('Error initializing private call WebRTC:', err);
        }
      }
    }

    initPrivateCallWebRTC();
  }, [activePrivateCall, isStreamer, socket, user?.id]);

  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const handleRequestPrivateCallClick = async () => {
    setRequestPending(true);
    setRequestMessage(null);
    try {
      await requestPrivateCall(room.streamerId);
      setRequestMessage('Request sent to streamer! Waiting for response...');
    } catch (err: unknown) {
      setRequestPending(false);
      if (err instanceof Error) setRequestMessage(err.message);
      else setRequestMessage('Failed to send call request');
    }
  };

  const handleEndStreamOrLeave = async () => {
    if (isStreamer) {
      await stopStream();
    } else {
      leaveStream(room.id);
    }
    if (rtcManagerRef.current) {
      rtcManagerRef.current.destroy();
    }
    onLeave();
  };

  const handleEndPrivateCallClick = async () => {
    if (activePrivateCall) {
      await endPrivateCall(activePrivateCall.session.id);
      setRemoteStream(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleEndStreamOrLeave}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Return to Lobby"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-white leading-none">{room.title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Streamer: <span className="text-indigo-400 font-medium">{room.streamerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activePrivateCall ? (
            <button
              onClick={handleEndPrivateCallClick}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
            >
              <PhoneOff className="w-4 h-4" /> End Private Call
            </button>
          ) : isStreamer ? (
            <button
              onClick={handleEndStreamOrLeave}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
            >
              <PhoneOff className="w-4 h-4" /> Stop Stream
            </button>
          ) : (
            <button
              onClick={handleEndStreamOrLeave}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Leave Stream
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      {activePrivateCall ? (
        /* 1-on-1 Private Call Mode */
        <div className="space-y-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between text-xs text-purple-300">
            <span className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              Private 1-on-1 Call Active with {activePrivateCall.peerName}
            </span>
            <span>Public stream paused temporarily</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VideoPlayer
              stream={localStream}
              isLocal={true}
              title={`You (${user?.username})`}
            />
            <VideoPlayer
              stream={remoteStream}
              isLocal={false}
              title={activePrivateCall.peerName}
            />
          </div>
        </div>
      ) : (
        /* Public Live Stream Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayer
              stream={isStreamer ? localStream : remoteStream}
              isLocal={isStreamer}
              title={isStreamer ? 'Your Stream Broadcast' : `${room.streamerName}'s Live Feed`}
            />

            {/* Viewer Action: Request Private Call */}
            {!isStreamer && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">Want a private 1-on-1 conversation?</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Send a request to {room.streamerName}. If accepted, you will enter a private video call.
                  </p>
                </div>

                <button
                  onClick={handleRequestPrivateCallClick}
                  disabled={requestPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 whitespace-nowrap transition-all disabled:opacity-50"
                >
                  {requestPending ? 'Request Pending...' : 'Request Private Call'}
                </button>
              </div>
            )}

            {requestMessage && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                {requestMessage}
              </div>
            )}
          </div>

          {/* Sidebar / Media Controls & Viewers */}
          <div className="space-y-4">
            {/* Local Media Controls (Streamer or Active Call) */}
            {(isStreamer || activePrivateCall) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Audio / Video Controls</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleMic}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      micEnabled
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    {micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                  </button>

                  <button
                    onClick={handleToggleVideo}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      videoEnabled
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    {videoEnabled ? 'Stop Camera' : 'Start Camera'}
                  </button>
                </div>
              </div>
            )}

            {/* Stream Info Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stream Metadata</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Streamer</span>
                  <span className="font-semibold">{room.streamerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Viewers Count</span>
                  <span className="font-semibold">{room.viewers.length} watching</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-emerald-400">
                    {room.isPausedForPrivate ? 'Paused for 1-on-1' : 'Live Streaming'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
