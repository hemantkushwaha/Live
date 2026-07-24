import { PrivateCallSettings } from '../../shared/types';
import { Logger } from '../utils/logger';

export class PrivateCallSettingsService {
  private static instance: PrivateCallSettingsService;
  private settingsMap: Map<string, PrivateCallSettings> = new Map();

  public static getInstance(): PrivateCallSettingsService {
    if (!PrivateCallSettingsService.instance) {
      PrivateCallSettingsService.instance = new PrivateCallSettingsService();
    }
    return PrivateCallSettingsService.instance;
  }

  /**
   * Get private call settings for a creator (with defaults)
   */
  public getSettings(creatorId: string): PrivateCallSettings {
    if (!this.settingsMap.has(creatorId)) {
      const defaultSettings: PrivateCallSettings = {
        creatorId,
        enabled: true,
        minCoins: 100,
        pricePerMinute: 50,
        maxDuration: 10,
        busyMode: false,
      };
      this.settingsMap.set(creatorId, defaultSettings);
    }
    return this.settingsMap.get(creatorId)!;
  }

  /**
   * Update settings for a creator
   */
  public updateSettings(creatorId: string, updates: Partial<PrivateCallSettings>): PrivateCallSettings {
    const current = this.getSettings(creatorId);
    const updated: PrivateCallSettings = {
      ...current,
      ...updates,
      creatorId, // Immutable creatorId
    };

    // Ensure valid non-negative numbers
    if (updated.minCoins < 0) updated.minCoins = 0;
    if (updated.pricePerMinute < 0) updated.pricePerMinute = 0;
    if (updated.maxDuration <= 0) updated.maxDuration = 1;

    this.settingsMap.set(creatorId, updated);
    Logger.info('PrivateCallSettingsService', `Updated settings for creator ${creatorId}: enabled=${updated.enabled}, minCoins=${updated.minCoins}, price/min=${updated.pricePerMinute}, maxDuration=${updated.maxDuration}, busyMode=${updated.busyMode}`);
    return updated;
  }
}

export const privateCallSettingsService = PrivateCallSettingsService.getInstance();
