import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserCoords = { latitude: number; longitude: number };

const DISMISSED_KEY = 'location_prompt_dismissed';

/**
 * Returns the user's current location if permission is already granted,
 * whether location permission is granted, whether permission can still be
 * requested, a function to request it, whether the user has dismissed the
 * location prompt, and a function to dismiss it.
 */
export function useUserLocation(): {
  coords: UserCoords | null;
  permissionGranted: boolean;
  canAskPermission: boolean;
  requestPermission: () => Promise<void>;
  promptDismissed: boolean;
  dismissPrompt: () => Promise<void>;
} {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [permission, requestForegroundPermission] = Location.useForegroundPermissions();
  const [promptDismissed, setPromptDismissed] = useState(false);

  const permissionGranted = permission?.granted ?? false;
  const canAskPermission =
    permission == null || (permission.status !== 'granted' && permission.canAskAgain);

  // Load persisted dismiss flag on mount
  useEffect(() => {
    if (Platform.OS === 'web') return;
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((value) => {
        if (value === 'true') setPromptDismissed(true);
      })
      .catch(() => {});
  }, []);

  // Clear the dismissed flag once the user actually grants permission
  useEffect(() => {
    if (!permissionGranted) return;
    setPromptDismissed(false);
    AsyncStorage.removeItem(DISMISSED_KEY).catch(() => {});
  }, [permissionGranted]);

  const dismissPrompt = useCallback(async () => {
    setPromptDismissed(true);
    if (Platform.OS !== 'web') {
      await AsyncStorage.setItem(DISMISSED_KEY, 'true').catch(() => {});
    }
  }, []);

  async function requestPermission() {
    if (Platform.OS === 'web') return;
    await requestForegroundPermission();
  }

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!permissionGranted) {
      setCoords(null);
      return;
    }
    let cancelled = false;
    Location.getLastKnownPositionAsync()
      .then((pos) => {
        if (!cancelled && pos) {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      })
      .catch(() => {});

    // Also fetch a fresh fix in the background
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((pos) => {
        if (!cancelled) {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [permissionGranted]);

  return { coords, permissionGranted, canAskPermission, requestPermission, promptDismissed, dismissPrompt };
}
