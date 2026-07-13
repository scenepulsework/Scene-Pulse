import { useState, useCallback, useEffect } from "react";

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

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<number>>(() => readSet());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setWatchlist(readSet());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isWatchlisted = useCallback((id: number) => watchlist.has(id), [watchlist]);

  const addToWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeSet(next);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      next.delete(id);
      writeSet(next);
      return next;
    });
  }, []);

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

  return { isWatchlisted, addToWatchlist, removeFromWatchlist, toggle };
}
