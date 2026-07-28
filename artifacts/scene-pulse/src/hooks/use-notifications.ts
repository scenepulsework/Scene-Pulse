import { useCallback } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  getListNotificationsQueryKey,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
} from "@workspace/api-client-react";

export function useNotifications() {
  const { isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      enabled: Boolean(isLoaded && isSignedIn),
      refetchInterval: 60_000, // poll every minute
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useCallback(
    async (id: number) => {
      // Optimistic update
      const key = getListNotificationsQueryKey();
      queryClient.setQueryData(key, (prev: unknown) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((n: { id: number; isRead: boolean }) =>
          n.id === id ? { ...n, isRead: true } : n,
        );
      });
      try {
        await apiMarkRead(id);
      } finally {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    [queryClient],
  );

  const markAllRead = useCallback(async () => {
    const key = getListNotificationsQueryKey();
    queryClient.setQueryData(key, (prev: unknown) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((n: { isRead: boolean }) => ({ ...n, isRead: true }));
    });
    try {
      await apiMarkAllRead();
    } finally {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}
