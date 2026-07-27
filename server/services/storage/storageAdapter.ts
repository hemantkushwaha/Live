import { MediaMetadata } from '../../../shared/types';

export interface UploadOptions {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  ownerId: string;
  folder?: string;
  width?: number;
  height?: number;
}

export interface StorageAdapter {
  providerName: 'cloudinary' | 's3' | 'local';
  upload(options: UploadOptions): Promise<MediaMetadata>;
  delete(mediaId: string, url?: string): Promise<boolean>;
  getMetadata(mediaId: string): Promise<MediaMetadata | null>;
}
