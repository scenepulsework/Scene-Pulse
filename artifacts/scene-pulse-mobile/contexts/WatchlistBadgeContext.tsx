import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import { useListWatchlist, getListWatchlistQueryKey } from '@workspace/api-client-react';

const PACKED_THRESHOLD = 80;

type WatchlistBadgeContextValue = {
  hasPackedBadge: boolean;
  /** IDs of venues that were packed when the badge was last raised. */
  newlyPackedIds: number[];
  clearBadge: () => void;
};

const WatchlistBadgeContext = createContext<WatchlistBadgeContextValue>({
  hasPackedBadge: false,
  newlyPackedIds: [],
  clearBadge: () => {},
});

export function WatchlistBadgeProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [badgeSeen, setBadgeSeen] = useState(false);
  const [newlyPackedIds, setNewlyPackedIds] = useState<number[]>([]);

  const { data: watchlist = [] } = useListWatchlist({
    query: {
      enabled: !!isSignedIn,
      queryKey: getListWatchlistQueryKey(),
      refetchInterval: 60_000,
    },
  });

  // Whether any watchlisted venue is currently packed
  const hasPacked =
    isSignedIn === true &&
    watchlist.length > 0 &&
    watchlist.some((v) => v.crowdScore >= PACKED_THRESHOLD);

  // Track the previous hasPacked value so we re-raise the badge when a
  // new packed venue appears after the user has already cleared it.
  const prevHadPacked = useRef(hasPacked);
  useEffect(() => {
    if (hasPacked && !prevHadPacked.current) {
      // A new packed venue appeared — raise the badge again and record which venues are packed.
      setBadgeSeen(false);
      setNewlyPackedIds(
        watchlist
          .filter((v) => v.crowdScore >= PACKED_THRESHOLD)
          .map((v) => v.id),
      );
    } else if (!hasPacked && prevHadPacked.current) {
      // No packed venues remain — clear stale highlight IDs.
      setNewlyPackedIds([]);
    }
    prevHadPacked.current = hasPacked;
  }, [hasPacked, watchlist]);

  // On first load, if venues are already packed, seed the newly-packed set.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current && hasPacked && watchlist.length > 0) {
      seededRef.current = true;
      setNewlyPackedIds(
        watchlist
          .filter((v) => v.crowdScore >= PACKED_THRESHOLD)
          .map((v) => v.id),
      );
    }
  }, [hasPacked, watchlist]);

  const clearBadge = useCallback(() => {
    setBadgeSeen(true);
    setNewlyPackedIds([]);
  }, []);

  const hasPackedBadge = hasPacked && !badgeSeen;

  return (
    <WatchlistBadgeContext.Provider value={{ hasPackedBadge, newlyPackedIds, clearBadge }}>
      {children}
    </WatchlistBadgeContext.Provider>
  );
}

export function useWatchlistBadge() {
  return useContext(WatchlistBadgeContext);
}
