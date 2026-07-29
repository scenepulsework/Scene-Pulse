import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import { useListWatchlist, getListWatchlistQueryKey } from '@workspace/api-client-react';

const PACKED_THRESHOLD = 80;

type WatchlistBadgeContextValue = {
  hasPackedBadge: boolean;
  clearBadge: () => void;
};

const WatchlistBadgeContext = createContext<WatchlistBadgeContextValue>({
  hasPackedBadge: false,
  clearBadge: () => {},
});

export function WatchlistBadgeProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [badgeSeen, setBadgeSeen] = useState(false);

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
      // A new packed venue appeared — raise the badge again.
      setBadgeSeen(false);
    }
    prevHadPacked.current = hasPacked;
  }, [hasPacked]);

  const clearBadge = useCallback(() => setBadgeSeen(true), []);

  const hasPackedBadge = hasPacked && !badgeSeen;

  return (
    <WatchlistBadgeContext.Provider value={{ hasPackedBadge, clearBadge }}>
      {children}
    </WatchlistBadgeContext.Provider>
  );
}

export function useWatchlistBadge() {
  return useContext(WatchlistBadgeContext);
}
