import { StorageAdapter, UploadOptions } from './storage/storageAdapter';
import { CloudinaryAdapter } from './storage/cloudinaryAdapter';
import { LocalStorageAdapter } from './storage/localStorageAdapter';
import { mediaRepository, MediaRepository } from './mediaRepository';
import { MediaMetadata } from '../../shared/types';
import { ValidationError, NotFoundError } from '../../shared/errors/errors';
import { Logger } from '../utils/logger';

export class MediaService {
  private static instance: MediaService;
  private adapter: StorageAdapter;
  private repository: MediaRepository;

  private MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  private ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ]);

  private constructor() {
    this.repository = mediaRepository;
    const provider = process.env.STORAGE_PROVIDER || 'cloudinary';

    if (provider === 'local') {
      this.adapter = new LocalStorageAdapter();
    } else {
      this.adapter = new CloudinaryAdapter();
    }

    Logger.info('MediaService', `Initialized MediaService with adapter [${this.adapter.providerName}]`);
  }

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Validate image file size & MIME type
   */
  public validateFile(buffer: Buffer, mimeType: string, originalName?: string): void {
    if (!buffer || buffer.length === 0) {
      throw new ValidationError('File buffer cannot be empty');
    }

    if (buffer.length > this.MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(`File size exceeds maximum allowed limit of 10 MB (${(buffer.length / (1024 * 1024)).toFixed(2)} MB uploaded)`);
    }

    if (!this.ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      throw new ValidationError(`Invalid or unsupported file format [${mimeType}]. Allowed formats: JPG, PNG, WEBP, AVIF`);
    }

    // Check for dangerous or executable file extensions in name
    if (originalName) {
      const lower = originalName.toLowerCase();
      if (lower.endsWith('.exe') || lower.endsWith('.sh') || lower.endsWith('.js') || lower.endsWith('.php') || lower.endsWith('.py')) {
        throw new ValidationError('Security violation: Executable file upload attempt blocked');
      }
    }
  }

  /**
   * Upload image file buffer
   */
  public async uploadMedia(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
    ownerId: string,
    folder: string = 'general'
  ): Promise<MediaMetadata> {
    this.validateFile(buffer, mimeType, originalName);

    const uploadOptions: UploadOptions = {
      buffer,
      mimeType,
      originalName,
      ownerId,
      folder,
    };

    const metadata = await this.adapter.upload(uploadOptions);
    return await this.repository.save(metadata);
  }

  /**
   * Process and store avatar image upload for creator
   */
  public async uploadAvatar(buffer: Buffer, mimeType: string, originalName: string, ownerId: string): Promise<MediaMetadata> {
    return this.uploadMedia(buffer, mimeType, originalName, ownerId, 'avatars');
  }

  /**
   * Process and store cover image upload for creator
   */
  public async uploadCoverImage(buffer: Buffer, mimeType: string, originalName: string, ownerId: string): Promise<MediaMetadata> {
    return this.uploadMedia(buffer, mimeType, originalName, ownerId, 'covers');
  }

  /**
   * Generate & store stream thumbnail
   */
  public async uploadStreamThumbnail(buffer: Buffer, mimeType: string, originalName: string, ownerId: string): Promise<MediaMetadata> {
    return this.uploadMedia(buffer, mimeType, originalName, ownerId, 'thumbnails');
  }

  /**
   * Replace existing media file
   */
  public async replaceMedia(
    mediaId: string,
    buffer: Buffer,
    mimeType: string,
    originalName: string,
    ownerId: string
  ): Promise<MediaMetadata> {
    const existing = await this.repository.findById(mediaId);
    if (existing) {
      await this.adapter.delete(existing.id, existing.url);
      await this.repository.delete(existing.id);
    }

    return this.uploadMedia(buffer, mimeType, originalName, ownerId);
  }

  /**
   * Get metadata for a media item
   */
  public async getMedia(mediaId: string): Promise<MediaMetadata> {
    const metadata = await this.repository.findById(mediaId);
    if (!metadata) {
      throw new NotFoundError(`Media item with ID ${mediaId} not found`);
    }
    return metadata;
  }

  /**
   * Delete media item by ID
   */
  public async deleteMedia(mediaId: string, requesterOwnerId?: string): Promise<boolean> {
    const metadata = await this.repository.findById(mediaId);
    if (!metadata) {
      throw new NotFoundError(`Media item with ID ${mediaId} not found`);
    }

    if (requesterOwnerId && metadata.ownerId !== requesterOwnerId) {
      throw new ValidationError('You do not have permission to delete this media item');
    }

    await this.adapter.delete(metadata.id, metadata.url);
    await this.repository.delete(metadata.id);

    Logger.info('MediaService', `Deleted media item ${mediaId}`);
    return true;
  }
}

export const mediaService = MediaService.getInstance();
