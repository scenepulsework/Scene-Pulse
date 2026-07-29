import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Returns `true` while the app is in the foreground (active or inactive).
 * Transitions to `false` when the app moves to the background.
 */
export function useAppForeground(): boolean {
  const [isForegrounded, setIsForegrounded] = useState(
    AppState.currentState !== 'background',
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      setIsForegrounded(next !== 'background');
    });
    return () => sub.remove();
  }, []);

  return isForegrounded;
}
