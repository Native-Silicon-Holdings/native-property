/**
 * Tauri Service - Provides interface to Tauri native features
 * This service works in both web and desktop contexts
 */

import { invoke } from '@tauri-apps/api/core';
import { check as checkForUpdates, Update } from '@tauri-apps/plugin-updater';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { open as openUrl } from '@tauri-apps/plugin-shell';
import { Store } from '@tauri-apps/plugin-store';

// Type definitions
export interface UserPreferences {
  theme: string;
  language: string;
  notifications_enabled: boolean;
  auto_update: boolean;
  start_minimized: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  os_version: string;
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  release_notes?: string;
}

class TauriService {
  private store: Store | null = null;
  private isDesktop: boolean = false;

  constructor() {
    // Check if running in Tauri context
    this.isDesktop = '__TAURI__' in window;

    if (this.isDesktop) {
      this.initializeStore();
    }
  }

  /**
   * Initialize the store plugin
   */
  private async initializeStore() {
    try {
      this.store = await Store.load('estate-management.dat');
    } catch (error) {
      console.error('Failed to initialize store:', error);
    }
  }

  /**
   * Check if running in desktop mode
   */
  public isTauriContext(): boolean {
    return this.isDesktop;
  }

  /**
   * Greet command (example)
   */
  public async greet(name: string): Promise<string> {
    if (!this.isDesktop) return `Hello, ${name}! (Web mode)`;

    try {
      return await invoke<string>('greet', { name });
    } catch (error) {
      console.error('Greet command failed:', error);
      throw error;
    }
  }

  /**
   * Get application version
   */
  public async getAppVersion(): Promise<string> {
    if (!this.isDesktop) return '1.0.0 (Web)';

    try {
      return await invoke<string>('get_app_version');
    } catch (error) {
      console.error('Failed to get app version:', error);
      return '1.0.0';
    }
  }

  /**
   * Check for updates
   */
  public async checkForUpdates(): Promise<Update | null> {
    if (!this.isDesktop) return null;

    try {
      const update = await checkForUpdates();
      return update;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  /**
   * Save authentication token
   */
  public async saveAuthToken(token: string): Promise<void> {
    if (!this.isDesktop) {
      // Fallback to localStorage in web mode
      localStorage.setItem('auth_token', token);
      return;
    }

    try {
      await invoke('save_auth_token', { token });
      // Also save to store for persistence
      if (this.store) {
        await this.store.set('auth_token', token);
        await this.store.save();
      }
    } catch (error) {
      console.error('Failed to save auth token:', error);
      throw error;
    }
  }

  /**
   * Get authentication token
   */
  public async getAuthToken(): Promise<string | null> {
    if (!this.isDesktop) {
      return localStorage.getItem('auth_token');
    }

    try {
      // Try to get from store first
      if (this.store) {
        const token = await this.store.get<string>('auth_token');
        if (token) return token;
      }

      // Fallback to command
      return await invoke<string | null>('get_auth_token');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Clear authentication token
   */
  public async clearAuthToken(): Promise<void> {
    if (!this.isDesktop) {
      localStorage.removeItem('auth_token');
      return;
    }

    try {
      await invoke('clear_auth_token');
      if (this.store) {
        await this.store.delete('auth_token');
        await this.store.save();
      }
    } catch (error) {
      console.error('Failed to clear auth token:', error);
      throw error;
    }
  }

  /**
   * Save user preferences
   */
  public async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    if (!this.isDesktop) {
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
      return;
    }

    try {
      await invoke('save_user_preferences', { preferences });
      if (this.store) {
        await this.store.set('user_preferences', preferences);
        await this.store.save();
      }
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  public async getUserPreferences(): Promise<UserPreferences | null> {
    if (!this.isDesktop) {
      const prefs = localStorage.getItem('user_preferences');
      return prefs ? JSON.parse(prefs) : null;
    }

    try {
      if (this.store) {
        const prefs = await this.store.get<UserPreferences>('user_preferences');
        if (prefs) return prefs;
      }

      return await invoke<UserPreferences>('get_user_preferences');
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  /**
   * Show native notification
   */
  public async showNotification(title: string, body: string): Promise<void> {
    if (!this.isDesktop) {
      // Fallback to web notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    try {
      let permissionGranted = await isPermissionGranted();

      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      if (permissionGranted) {
        await sendNotification({ title, body });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Open external URL
   */
  public async openExternalUrl(url: string): Promise<void> {
    if (!this.isDesktop) {
      window.open(url, '_blank');
      return;
    }

    try {
      await openUrl(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
      throw error;
    }
  }

  /**
   * Get system information
   */
  public async getSystemInfo(): Promise<SystemInfo | null> {
    if (!this.isDesktop) return null;

    try {
      return await invoke<SystemInfo>('get_system_info');
    } catch (error) {
      console.error('Failed to get system info:', error);
      return null;
    }
  }

  /**
   * Log event for analytics/debugging
   */
  public async logEvent(event: string, data?: string): Promise<void> {
    if (!this.isDesktop) {
      console.log('Event:', event, data);
      return;
    }

    try {
      await invoke('log_event', { event, data });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  /**
   * Export data to file
   */
  public async exportDataToFile(data: string, filename: string): Promise<string | null> {
    if (!this.isDesktop) {
      // Fallback to browser download
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return filename;
    }

    try {
      return await invoke<string>('export_data_to_file', { data, filename });
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * Import data from file
   */
  public async importDataFromFile(): Promise<string | null> {
    if (!this.isDesktop) {
      // Fallback to file input
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }

    try {
      return await invoke<string>('import_data_from_file');
    } catch (error) {
      console.error('Failed to import data:', error);
      return null;
    }
  }

  /**
   * Validate backend connection
   */
  public async validateBackendConnection(backendUrl: string): Promise<boolean> {
    if (!this.isDesktop) {
      try {
        const response = await fetch(`${backendUrl}/health`);
        return response.ok;
      } catch {
        return false;
      }
    }

    try {
      return await invoke<boolean>('validate_backend_connection', { backendUrl });
    } catch (error) {
      console.error('Failed to validate backend connection:', error);
      return false;
    }
  }

  /**
   * Store data in secure storage
   */
  public async storeSecureData(key: string, value: unknown): Promise<void> {
    if (!this.isDesktop || !this.store) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }

    try {
      await this.store.set(key, value);
      await this.store.save();
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw error;
    }
  }

  /**
   * Retrieve data from secure storage
   */
  public async getSecureData<T>(key: string): Promise<T | null> {
    if (!this.isDesktop || !this.store) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }

    try {
      return await this.store.get<T>(key);
    } catch (error) {
      console.error('Failed to get secure data:', error);
      return null;
    }
  }

  /**
   * Delete data from secure storage
   */
  public async deleteSecureData(key: string): Promise<void> {
    if (!this.isDesktop || !this.store) {
      localStorage.removeItem(key);
      return;
    }

    try {
      await this.store.delete(key);
      await this.store.save();
    } catch (error) {
      console.error('Failed to delete secure data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tauriService = new TauriService();
export default tauriService;
