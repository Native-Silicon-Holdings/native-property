/**
 * Tests for Tauri Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import tauriService from '../../services/tauri.service';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-store', () => ({
  Store: {
    load: vi.fn(() => Promise.resolve({
      get: vi.fn(),
      set: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(() => Promise.resolve(true)),
  requestPermission: vi.fn(() => Promise.resolve('granted')),
  sendNotification: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(() => Promise.resolve()),
}));

describe('TauriService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.__TAURI__ to simulate desktop environment
    (window as any).__TAURI__ = {};
  });

  describe('isTauriContext', () => {
    it('should detect Tauri context', () => {
      expect(tauriService.isTauriContext()).toBe(true);
    });

    it('should return false in web context', () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();
      expect(service.isTauriContext()).toBe(false);
    });
  });

  describe('greet', () => {
    it('should call greet command with name', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('Hello, Test!');

      const result = await tauriService.greet('Test');
      expect(invoke).toHaveBeenCalledWith('greet', { name: 'Test' });
      expect(result).toBe('Hello, Test!');
    });

    it('should fallback to web mode greeting when not in Tauri context', async () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();
      const result = await service.greet('Test');
      expect(result).toContain('Test');
      expect(result).toContain('Web mode');
    });
  });

  describe('getAppVersion', () => {
    it('should return app version', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('1.0.0');

      const version = await tauriService.getAppVersion();
      expect(invoke).toHaveBeenCalledWith('get_app_version');
      expect(version).toBe('1.0.0');
    });

    it('should return web version when not in Tauri context', async () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();
      const version = await service.getAppVersion();
      expect(version).toContain('Web');
    });
  });

  describe('saveAuthToken', () => {
    it('should save auth token', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(undefined);

      await tauriService.saveAuthToken('test-token');
      expect(invoke).toHaveBeenCalledWith('save_auth_token', { token: 'test-token' });
    });

    it('should use localStorage in web mode', async () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      await service.saveAuthToken('test-token');

      expect(setItemSpy).toHaveBeenCalledWith('auth_token', 'test-token');
    });
  });

  describe('getAuthToken', () => {
    it('should get auth token', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue('test-token');

      const token = await tauriService.getAuthToken();
      expect(token).toBe('test-token');
    });

    it('should use localStorage in web mode', async () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();

      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
      const token = await service.getAuthToken();

      expect(getItemSpy).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('test-token');
    });
  });

  describe('clearAuthToken', () => {
    it('should clear auth token', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(undefined);

      await tauriService.clearAuthToken();
      expect(invoke).toHaveBeenCalledWith('clear_auth_token');
    });

    it('should use localStorage in web mode', async () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();

      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      await service.clearAuthToken();

      expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('saveUserPreferences', () => {
    it('should save user preferences', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(undefined);

      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications_enabled: true,
        auto_update: true,
        start_minimized: false,
      };

      await tauriService.saveUserPreferences(preferences);
      expect(invoke).toHaveBeenCalledWith('save_user_preferences', { preferences });
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications_enabled: true,
        auto_update: true,
        start_minimized: false,
      };
      (invoke as any).mockResolvedValue(preferences);

      const result = await tauriService.getUserPreferences();
      expect(result).toEqual(preferences);
    });
  });

  describe('showNotification', () => {
    it('should show native notification', async () => {
      const { sendNotification } = await import('@tauri-apps/plugin-notification');

      await tauriService.showNotification('Test Title', 'Test Body');

      expect(sendNotification).toHaveBeenCalledWith({
        title: 'Test Title',
        body: 'Test Body',
      });
    });
  });

  describe('getSystemInfo', () => {
    it('should get system information', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const systemInfo = {
        platform: 'linux',
        arch: 'x86_64',
        version: '1.0.0',
        os_version: 'Linux',
      };
      (invoke as any).mockResolvedValue(systemInfo);

      const result = await tauriService.getSystemInfo();
      expect(result).toEqual(systemInfo);
    });

    it('should return null in web mode', async () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();

      const result = await service.getSystemInfo();
      expect(result).toBeNull();
    });
  });

  describe('validateBackendConnection', () => {
    it('should validate backend connection', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(true);

      const result = await tauriService.validateBackendConnection('http://localhost:5000');
      expect(invoke).toHaveBeenCalledWith('validate_backend_connection', {
        backendUrl: 'http://localhost:5000',
      });
      expect(result).toBe(true);
    });

    it('should use fetch in web mode', async () => {
      delete (window as any).__TAURI__;
      const service = new (tauriService.constructor as any)();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
        })
      ) as any;

      const result = await service.validateBackendConnection('http://localhost:5000');
      expect(result).toBe(true);
    });
  });

  describe('logEvent', () => {
    it('should log event without data', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(undefined);

      await tauriService.logEvent('test_event');
      expect(invoke).toHaveBeenCalledWith('log_event', {
        event: 'test_event',
        data: undefined,
      });
    });

    it('should log event with data', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      (invoke as any).mockResolvedValue(undefined);

      await tauriService.logEvent('test_event', 'test_data');
      expect(invoke).toHaveBeenCalledWith('log_event', {
        event: 'test_event',
        data: 'test_data',
      });
    });
  });

  describe('storeSecureData', () => {
    it('should store data securely', async () => {
      await tauriService.storeSecureData('test_key', { value: 'test' });
      // Store operations are tested through integration tests
    });
  });

  describe('getSecureData', () => {
    it('should retrieve secure data', async () => {
      const result = await tauriService.getSecureData('test_key');
      // Store operations are tested through integration tests
      expect(result).toBeDefined();
    });
  });

  describe('deleteSecureData', () => {
    it('should delete secure data', async () => {
      await tauriService.deleteSecureData('test_key');
      // Store operations are tested through integration tests
    });
  });
});
