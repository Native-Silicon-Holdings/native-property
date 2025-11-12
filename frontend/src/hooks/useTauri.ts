/**
 * React hooks for Tauri functionality
 */

import { useEffect, useState, useCallback } from 'react';
import tauriService, { SystemInfo, UserPreferences } from '../services/tauri.service';

/**
 * Hook to check if running in Tauri desktop context
 */
export function useTauriContext() {
  return tauriService.isTauriContext();
}

/**
 * Hook to get system information
 */
export function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const info = await tauriService.getSystemInfo();
        setSystemInfo(info);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (tauriService.isTauriContext()) {
      fetchSystemInfo();
    } else {
      setLoading(false);
    }
  }, []);

  return { systemInfo, loading, error };
}

/**
 * Hook to check for app updates
 */
export function useAppUpdates() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkForUpdates = useCallback(async () => {
    try {
      setChecking(true);
      setError(null);
      const update = await tauriService.checkForUpdates();
      setUpdateAvailable(!!update);
      return update;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  return { checkForUpdates, checking, updateAvailable, error };
}

/**
 * Hook to manage user preferences with Tauri store
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const prefs = await tauriService.getUserPreferences();
        setPreferences(prefs);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const savePreferences = useCallback(async (newPreferences: UserPreferences) => {
    try {
      setError(null);
      await tauriService.saveUserPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return { preferences, savePreferences, loading, error };
}

/**
 * Hook to send native notifications
 */
export function useNotifications() {
  const showNotification = useCallback(async (title: string, body: string) => {
    try {
      await tauriService.showNotification(title, body);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, []);

  return { showNotification };
}

/**
 * Hook for secure storage operations
 */
export function useSecureStorage<T>(key: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const value = await tauriService.getSecureData<T>(key);
        setData(value);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key]);

  const store = useCallback(async (value: T) => {
    try {
      setError(null);
      await tauriService.storeSecureData(key, value);
      setData(value);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [key]);

  const remove = useCallback(async () => {
    try {
      setError(null);
      await tauriService.deleteSecureData(key);
      setData(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [key]);

  return { data, store, remove, loading, error };
}

/**
 * Hook for file operations
 */
export function useFileOperations() {
  const exportData = useCallback(async (data: string, filename: string) => {
    try {
      const path = await tauriService.exportDataToFile(data, filename);
      return path;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }, []);

  const importData = useCallback(async () => {
    try {
      const data = await tauriService.importDataFromFile();
      return data;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }, []);

  return { exportData, importData };
}

/**
 * Hook to validate backend connection
 */
export function useBackendConnection(backendUrl: string) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      setChecking(true);
      const connected = await tauriService.validateBackendConnection(backendUrl);
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.error('Failed to check backend connection:', error);
      setIsConnected(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (backendUrl) {
      checkConnection();
    }
  }, [backendUrl, checkConnection]);

  return { isConnected, checking, checkConnection };
}
