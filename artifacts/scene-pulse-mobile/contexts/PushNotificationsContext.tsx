import React, { createContext, useContext } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationsContextValue {
  pushEnabled: boolean;
  togglePush: () => Promise<void>;
}

const PushNotificationsContext = createContext<PushNotificationsContextValue>({
  pushEnabled: false,
  togglePush: async () => {},
});

/**
 * Must be rendered inside ClerkProvider (so the underlying hook can
 * call useAuth). Handles push-token registration automatically and
 * exposes the enabled state + toggle to any child screen.
 */
export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const value = usePushNotifications();
  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotificationsContext() {
  return useContext(PushNotificationsContext);
}
