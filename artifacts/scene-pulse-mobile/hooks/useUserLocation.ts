import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type UserCoords = { latitude: number; longitude: number };

/**
 * Returns the user's current location if permission is already granted,
 * whether location permission is granted, whether permission can still be
 * requested, and a function to request it.
 */
export function useUserLocation(): {
  coords: UserCoords | null;
  permissionGranted: boolean;
  canAskPermission: boolean;
  requestPermission: () => Promise<void>;
} {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [permission, requestForegroundPermission] = Location.useForegroundPermissions();
  const permissionGranted = permission?.granted ?? false;
  const canAskPermission = permission == null || (permission.status !== 'granted' && permission.canAskAgain);

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

  return { coords, permissionGranted, canAskPermission, requestPermission };
}
