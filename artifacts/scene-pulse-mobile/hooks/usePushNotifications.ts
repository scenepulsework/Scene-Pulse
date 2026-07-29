import { useCallback, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { customFetch } from '@workspace/api-client-react';

const PUSH_OPT_OUT_KEY = 'scene_pulse_push_opted_out';
const PUSH_TOKEN_KEY = 'scene_pulse_push_token';

/** Returns the current Expo push token if permissions are granted, otherwise null. */
async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    // Expo tokens always start with "ExponentPushToken["
    return token.startsWith('ExponentPushToken[') ? token : null;
  } catch {
    return null;
  }
}

async function callPushTokenApi(method: 'POST' | 'DELETE', token: string): Promise<boolean> {
  try {
    await customFetch('/api/push-tokens', {
      method,
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Manages push notification registration with strong cross-account safety guarantees:
 *
 * - On sign-in: registers the device token, taking ownership from any prior user (server
 *   enforces unique-per-token ownership via upsert).
 * - On sign-out: deletes the cached token from the server AND clears AsyncStorage so
 *   the next user starts fresh, even if the DELETE request fails (we still clear local
 *   state so we re-register under the new account on next launch).
 * - On startup when signed out: clears any stale cached token left by a prior user whose
 *   sign-out DELETE may have failed, so it cannot leak.
 *
 * Returns:
 * - `pushEnabled`: whether push is currently active for this device
 * - `togglePush`: function to enable/disable push for this device
 */
export function usePushNotifications(): {
  pushEnabled: boolean;
  togglePush: () => Promise<void>;
} {
  const { isSignedIn } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const registeredToken = useRef<string | null>(null);
  const hasPrompted = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function sync() {
      if (!isSignedIn) {
        // Attempt to deregister any cached token, then clear local state unconditionally.
        // Clearing locally ensures the next sign-in re-registers rather than relying on
        // a prior DELETE having succeeded.
        const cachedToken = registeredToken.current ?? (await AsyncStorage.getItem(PUSH_TOKEN_KEY));
        if (cachedToken) {
          // Fire-and-forget — we clear local state regardless of outcome
          void callPushTokenApi('DELETE', cachedToken);
          await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
          registeredToken.current = null;
        }
        setPushEnabled(false);
        return;
      }

      // Check if user previously opted out
      const optedOut = await AsyncStorage.getItem(PUSH_OPT_OUT_KEY);
      if (optedOut === 'true') {
        setPushEnabled(false);
        return;
      }

      // Request permissions if needed (prompt only once per session)
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted' && !hasPrompted.current) {
        hasPrompted.current = true;
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setPushEnabled(false);
        return;
      }

      const token = await getExpoPushToken();
      if (!token) {
        setPushEnabled(false);
        return;
      }

      // Register with server (upsert — takes ownership if token belonged to a prior user).
      // Only mark enabled after server confirms registration.
      const ok = await callPushTokenApi('POST', token);
      if (ok) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        registeredToken.current = token;
        setPushEnabled(true);
      }
    }

    void sync();
  }, [isSignedIn]);

  const togglePush = useCallback(async () => {
    if (Platform.OS === 'web') return;

    if (pushEnabled) {
      // Opt out: deregister token from server, persist opt-out preference
      const token = registeredToken.current ?? (await AsyncStorage.getItem(PUSH_TOKEN_KEY));
      if (token) {
        await callPushTokenApi('DELETE', token);
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
        registeredToken.current = null;
      }
      await AsyncStorage.setItem(PUSH_OPT_OUT_KEY, 'true');
      setPushEnabled(false);
    } else {
      // Opt in: request permissions if needed and re-register
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const token = await getExpoPushToken();
      if (!token) return;

      const ok = await callPushTokenApi('POST', token);
      if (ok) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        await AsyncStorage.removeItem(PUSH_OPT_OUT_KEY);
        registeredToken.current = token;
        setPushEnabled(true);
      }
    }
  }, [pushEnabled]);

  return { pushEnabled, togglePush };
}
