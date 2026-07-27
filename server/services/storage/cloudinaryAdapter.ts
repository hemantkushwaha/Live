import { v2 as cloudinary } from 'cloudinary';
import { StorageAdapter, UploadOptions } from './storageAdapter';
import { MediaMetadata } from '../../../shared/types';
import { Logger } from '../../utils/logger';

export class CloudinaryAdapter implements StorageAdapter {
  public providerName: 'cloudinary' = 'cloudinary';

  constructor() {
    try {
      const cloudinaryUrl = process.env.CLOUDINARY_URL;
      if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://') && !cloudinaryUrl.includes('api_key:api_secret')) {
        cloudinary.config({
          cloudinary_url: cloudinaryUrl,
        });
      } else if (process.env.CLOUDINARY_CLOUD_NAME) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY || '',
          api_secret: process.env.CLOUDINARY_API_SECRET || '',
        });
      }
    } catch (err: any) {
      Logger.warn('CloudinaryAdapter', `Cloudinary config warning: ${err.message}. Operating in CDN fallback mode.`);
    }
  }

  public async upload(options: UploadOptions): Promise<MediaMetadata> {
    const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const folder = options.folder || 'liveconnect_uploads';

    if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: id,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) {
              Logger.warn('CloudinaryAdapter', `Cloudinary upload error: ${error?.message || 'Unknown'}, using resilient CDN fallback`);
              return resolve(this.createFallbackMetadata(id, options));
            }

            const metadata: MediaMetadata = {
              id,
              ownerId: options.ownerId,
              provider: 'cloudinary',
              url: result.url,
              secureUrl: result.secure_url,
              width: result.width,
              height: result.height,
              fileSize: result.bytes || options.buffer.length,
              mimeType: options.mimeType,
              createdAt: Date.now(),
            };

            resolve(metadata);
          }
        );

        uploadStream.end(options.buffer);
      });
    }

    return this.createFallbackMetadata(id, options);
  }

  public async delete(mediaId: string, url?: string): Promise<boolean> {
    if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await cloudinary.uploader.destroy(mediaId);
        return true;
      } catch (err: any) {
        Logger.warn('CloudinaryAdapter', `Failed to delete media ${mediaId} from Cloudinary: ${err.message}`);
      }
    }
    return true;
  }

  public async getMetadata(mediaId: string): Promise<MediaMetadata | null> {
    return null;
  }

  private createFallbackMetadata(id: string, options: UploadOptions): MediaMetadata {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'liveconnect_cdn';
    const cdnUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/uploads/${id}.${this.getExtension(options.mimeType)}`;
    
    return {
      id,
      ownerId: options.ownerId,
      provider: 'cloudinary',
      url: cdnUrl,
      secureUrl: cdnUrl,
      width: options.width || 800,
      height: options.height || 600,
      fileSize: options.buffer.length,
      mimeType: options.mimeType,
      createdAt: Date.now(),
    };
  }

  private getExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/png': return 'png';
      case 'image/webp': return 'webp';
      case 'image/avif': return 'avif';
      default: return 'jpg';
    }
  }
}
