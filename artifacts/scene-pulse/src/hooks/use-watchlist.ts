import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListWatchlist,
  getListWatchlistQueryKey,
  addToWatchlist as apiAdd,
  removeFromWatchlist as apiRemove,
} from "@workspace/api-client-react";

const STORAGE_KEY = "scenepulse.watchlist";

function readSet(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed as number[]);
  } catch {
    // ignore corrupt storage
  }
  return new Set();
}

function writeSet(set: Set<number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore storage errors
  }
}

/**
 * Watchlist hook.
 *
 * - Signed out: backed by localStorage (same behavior as before).
 * - Signed in: backed by the user's account via the API. Any venues saved
 *   locally before signing in are merged into the account once, then the
 *   local copy is cleared.
 */
export function useWatchlist() {
  const { isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const [localList, setLocalList] = useState<Set<number>>(() => readSet());
  const mergedRef = useRef(false);

  const { data: serverVenues } = useListWatchlist({
    query: {
      queryKey: getListWatchlistQueryKey(),
      enabled: Boolean(isLoaded && isSignedIn),
    },
  });

  const serverList = useMemo(
    () => new Set((serverVenues ?? []).map((v) => v.id)),
    [serverVenues],
  );

  // Cross-tab sync for the signed-out localStorage list.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setLocalList(readSet());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // One-time merge of pre-sign-in local saves into the account.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || mergedRef.current) return;
    const pending = readSet();
    if (pending.size === 0) {
      mergedRef.current = true;
      return;
    }
    mergedRef.current = true;
    (async () => {
      const ids = [...pending];
      const results = await Promise.allSettled(ids.map((id) => apiAdd(id)));
      // Only drop local entries that were successfully saved to the account,
      // so a network hiccup can't silently lose pre-sign-in saves.
      const failed = new Set(ids.filter((_, i) => results[i]?.status === "rejected"));
      writeSet(failed);
      if (failed.size > 0) mergedRef.current = false; // retry on next mount/sign-in
      setLocalList(failed);
      queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
    })();
  }, [isLoaded, isSignedIn, queryClient]);

  const watchlist = isSignedIn ? serverList : localList;

  const isWatchlisted = useCallback((id: number) => watchlist.has(id), [watchlist]);

  const mutateServer = useCallback(
    (id: number, add: boolean) => {
      // Optimistic cache update, then sync with the server.
      const key = getListWatchlistQueryKey();
      queryClient.setQueryData(key, (prev: unknown) => {
        if (!Array.isArray(prev)) return prev;
        return add ? prev : prev.filter((v: { id: number }) => v.id !== id);
      });
      (add ? apiAdd(id) : apiRemove(id))
        .catch(() => undefined)
        .finally(() => queryClient.invalidateQueries({ queryKey: key }));
    },
    [queryClient],
  );

  const addToWatchlist = useCallback(
    (id: number) => {
      if (isSignedIn) {
        mutateServer(id, true);
        return;
      }
      setLocalList((prev) => {
        const next = new Set(prev);
        next.add(id);
        writeSet(next);
        return next;
      });
    },
    [isSignedIn, mutateServer],
  );

  const removeFromWatchlist = useCallback(
    (id: number) => {
      if (isSignedIn) {
        mutateServer(id, false);
        return;
      }
      setLocalList((prev) => {
        const next = new Set(prev);
        next.delete(id);
        writeSet(next);
        return next;
      });
    },
    [isSignedIn, mutateServer],
  );

  const toggle = useCallback(
    (id: number) => {
      if (watchlist.has(id)) {
        removeFromWatchlist(id);
        return false;
      } else {
        addToWatchlist(id);
        return true;
      }
    },
    [watchlist, addToWatchlist, removeFromWatchlist],
  );

  return { isWatchlisted, addToWatchlist, removeFromWatchlist, toggle, isSignedIn: Boolean(isSignedIn) };
}
