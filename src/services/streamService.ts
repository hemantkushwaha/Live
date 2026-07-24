import { apiClient } from '../config/api';
import { StreamRoom, ApiResponse } from '../../shared/types';

export class ClientStreamService {
  /**
   * Start a public live stream via REST API
   */
  public static async startStream(title?: string): Promise<StreamRoom> {
    const response = await apiClient.post<ApiResponse<StreamRoom>>('/v1/streams/start', { title });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to start live stream');
  }

  /**
   * End an active public live stream via REST API
   */
  public static async endStream(): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/v1/streams/end');
    if (response.data && !response.data.success) {
      throw new Error(response.data?.message || 'Failed to end live stream');
    }
  }

  /**
   * Get active live streams list via REST API
   */
  public static async getActiveStreams(): Promise<StreamRoom[]> {
    const response = await apiClient.get<ApiResponse<StreamRoom[]>>('/v1/streams');
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }
}
