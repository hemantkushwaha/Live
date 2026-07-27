import { StorageAdapter, UploadOptions } from './storageAdapter';
import { MediaMetadata } from '../../../shared/types';
import fs from 'fs';
import path from 'path';

export class LocalStorageAdapter implements StorageAdapter {
  public providerName: 'local' = 'local';
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public async upload(options: UploadOptions): Promise<MediaMetadata> {
    const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const ext = this.getExtension(options.mimeType);
    const filename = `${id}.${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, options.buffer);

    const relativeUrl = `/uploads/${filename}`;
    const host = process.env.APP_URL || 'http://localhost:3000';
    const fullUrl = `${host}${relativeUrl}`;

    return {
      id,
      ownerId: options.ownerId,
      provider: 'local',
      url: fullUrl,
      secureUrl: fullUrl,
      width: options.width || 800,
      height: options.height || 600,
      fileSize: options.buffer.length,
      mimeType: options.mimeType,
      createdAt: Date.now(),
    };
  }

  public async delete(mediaId: string): Promise<boolean> {
    try {
      const files = await fs.promises.readdir(this.uploadDir);
      const target = files.find((f) => f.startsWith(mediaId));
      if (target) {
        await fs.promises.unlink(path.join(this.uploadDir, target));
      }
      return true;
    } catch {
      return false;
    }
  }

  public async getMetadata(mediaId: string): Promise<MediaMetadata | null> {
    return null;
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
