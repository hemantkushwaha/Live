import { apiClient } from '../config/api';
import { PrivateCallRequest, PrivateCallSettings } from '../../shared/types';

export class PrivateRequestClientService {
  /**
   * Fetch private call settings for a creator
   */
  public async getSettings(creatorId?: string): Promise<PrivateCallSettings> {
    const response = await apiClient.get<{ success: boolean; data: PrivateCallSettings }>(
      '/api/v1/private/settings',
      {
        params: creatorId ? { creatorId } : undefined,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch private call settings');
    }

    return response.data.data;
  }

  /**
   * Update settings for creator
   */
  public async updateSettings(updates: Partial<PrivateCallSettings>): Promise<PrivateCallSettings> {
    const response = await apiClient.put<{ success: boolean; data: PrivateCallSettings; message?: string }>(
      '/api/v1/private/settings',
      updates
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update private call settings');
    }

    return response.data.data;
  }

  /**
   * Send a private call request via REST API
   */
  public async createRequest(streamId: string, requestedDuration?: number): Promise<PrivateCallRequest> {
    const response = await apiClient.post<{ success: boolean; data: PrivateCallRequest; message?: string }>(
      '/api/v1/private/request',
      { streamId, requestedDuration }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to send private call request');
    }

    return response.data.data;
  }

  /**
   * Accept a private call request via REST API (Creator)
   */
  public async acceptRequest(requestId: string): Promise<PrivateCallRequest> {
    const response = await apiClient.post<{ success: boolean; data: PrivateCallRequest; message?: string }>(
      `/api/v1/private/request/${requestId}/accept`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to accept private call request');
    }

    return response.data.data;
  }

  /**
   * Reject a private call request via REST API (Creator)
   */
  public async rejectRequest(requestId: string): Promise<PrivateCallRequest> {
    const response = await apiClient.post<{ success: boolean; data: PrivateCallRequest; message?: string }>(
      `/api/v1/private/request/${requestId}/reject`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to reject private call request');
    }

    return response.data.data;
  }

  /**
   * Cancel an active request via REST API
   */
  public async cancelRequest(requestId: string): Promise<PrivateCallRequest> {
    const response = await apiClient.delete<{ success: boolean; data: PrivateCallRequest; message?: string }>(
      `/api/v1/private/request/${requestId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to cancel request');
    }

    return response.data.data;
  }

  /**
   * Fetch pending requests for a stream via REST API
   */
  public async getRequests(streamId?: string): Promise<PrivateCallRequest[]> {
    const response = await apiClient.get<{ success: boolean; data: PrivateCallRequest[] }>(
      '/api/v1/private/requests',
      {
        params: streamId ? { streamId } : undefined,
      }
    );

    if (!response.data.success) {
      return [];
    }

    return response.data.data || [];
  }
}

export const privateRequestClient = new PrivateRequestClientService();
