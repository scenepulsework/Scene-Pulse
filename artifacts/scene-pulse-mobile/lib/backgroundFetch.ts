import { Platform } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { queryClient } from './queryClient';

export const BACKGROUND_FETCH_TASK = 'scene-pulse-background-fetch';

const INTERVAL_SECONDS = 15 * 60; // 15 minutes

/**
 * Task definition — must be called at the top level of a module (not inside
 * a component or function) so Expo's task runner can find it at cold-start.
 *
 * Strategy: do a direct fetch to warm server-side data, then mark all
 * React Query caches as stale. The next foreground render refetches automatically.
 */
if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      // Fire-and-forget fetch to ensure server-side data is fresh,
      // then invalidate the client cache so the next render picks it up.
      await Promise.allSettled([
        fetch(`${baseUrl}/api/venues?sort=crowdScore`),
        fetch(`${baseUrl}/api/venues/hero-stats`),
      ]);
      await queryClient.invalidateQueries();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

/**
 * Register the background fetch task if the OS permits it.
 * Safe to call multiple times — skips registration when already registered.
 */
export async function registerBackgroundFetch(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      // User or parental controls have disabled background fetch — nothing to do.
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: INTERVAL_SECONDS,
        stopOnTerminate: false, // keep running after the app is killed
        startOnBoot: true,     // resume after device reboot
      });
    }
  } catch {
    // Registration failures are non-fatal — foreground polling still works.
  }
}
