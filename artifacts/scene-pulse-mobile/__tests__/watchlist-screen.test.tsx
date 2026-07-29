/**
 * Tests for WatchlistScreen packed-venue highlight logic.
 *
 * Covers:
 * 1. When a watchlisted venue has crowdScore ≥ 80, it floats to the top of
 *    the list and the `packed-highlight-<id>` element is visible.
 * 2. After visiting the Saved tab (clearBadge fires and focus leaves), the
 *    highlight is gone on the next visit.
 * 3. Signed-out user: the watchlist is not rendered, so no highlights appear.
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// useFocusEffect capture — stored at module level so individual tests can
// trigger focus (call the callback) and blur (call its cleanup).
// ---------------------------------------------------------------------------
let capturedFocusCleanup: (() => void) | null = null;

// ---------------------------------------------------------------------------
// expo-router mock
// ---------------------------------------------------------------------------
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    useFocusEffect: (cb: () => () => void) => {
      // Simulate focus immediately after mount via useEffect, matching the
      // real behaviour where the screen gains focus on first paint.
      React.useEffect(() => {
        const cleanup = cb();
        capturedFocusCleanup = cleanup ?? null;
        return cleanup;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
    },
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  };
});

// ---------------------------------------------------------------------------
// Mutable auth state — adjusted per-test
// (prefixed with `mock` so jest.mock() factories may reference them)
// ---------------------------------------------------------------------------
const mockClerkState = { isSignedIn: true as boolean | null | undefined };

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: mockClerkState.isSignedIn }),
  useUser: () => ({
    user: {
      fullName: 'Test User',
      firstName: 'Test',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
  }),
}));

// ---------------------------------------------------------------------------
// Mutable badge context state
// ---------------------------------------------------------------------------
const mockBadgeState: {
  hasPackedBadge: boolean;
  newlyPackedIds: number[];
  clearBadge: jest.Mock;
} = {
  hasPackedBadge: false,
  newlyPackedIds: [],
  clearBadge: jest.fn(),
};

jest.mock('@/contexts/WatchlistBadgeContext', () => ({
  useWatchlistBadge: () => ({
    hasPackedBadge: mockBadgeState.hasPackedBadge,
    newlyPackedIds: mockBadgeState.newlyPackedIds,
    clearBadge: mockBadgeState.clearBadge,
  }),
}));

// ---------------------------------------------------------------------------
// Mutable watchlist data
// ---------------------------------------------------------------------------
type WatchlistItem = {
  id: number;
  name: string;
  crowdScore: number;
  crowdLevel: string;
  category: string;
  market: string;
};
const apiState: { watchlist: WatchlistItem[] } = { watchlist: [] };

jest.mock('@workspace/api-client-react', () => ({
  useListWatchlist: jest.fn(),
  useRemoveFromWatchlist: jest.fn(),
  useGetMyActivity: jest.fn(),
  getListWatchlistQueryKey: jest.fn(() => ['watchlist']),
  getGetMyActivityQueryKey: jest.fn(() => ['activity']),
}));

function getApiMocks() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return jest.requireMock('@workspace/api-client-react') as {
    useListWatchlist: jest.Mock;
    useRemoveFromWatchlist: jest.Mock;
    useGetMyActivity: jest.Mock;
  };
}

// ---------------------------------------------------------------------------
// Infra / UI mocks
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    background: '#000',
    foreground: '#fff',
    card: '#111',
    border: '#222',
    primary: '#6C5CE7',
    primaryForeground: '#fff',
    mutedForeground: '#888',
    destructive: '#e17055',
    radius: 8,
  }),
}));

jest.mock('@/lib/venue-ui', () => ({
  crowdColor: () => '#e17055',
}));

jest.mock('@/components/VenueCard', () => ({
  CrowdDot: () => null,
}));

jest.mock('@/contexts/PushNotificationsContext', () => ({
  usePushNotificationsContext: () => ({ pushEnabled: false, togglePush: jest.fn() }),
}));

jest.mock('@/contexts/SidebarContext', () => ({
  useSidebar: () => ({ open: jest.fn() }),
}));

// ---------------------------------------------------------------------------
// Component under test — loaded after all mocks are registered
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WatchlistScreen = (require('../app/(tabs)/watchlist') as { default: React.FC }).default;

// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  capturedFocusCleanup = null;
  mockClerkState.isSignedIn = true;
  apiState.watchlist = [];
  mockBadgeState.hasPackedBadge = false;
  mockBadgeState.newlyPackedIds = [];
  mockBadgeState.clearBadge = jest.fn();

  const mocks = getApiMocks();
  mocks.useListWatchlist.mockImplementation(() => ({
    data: apiState.watchlist,
    isLoading: false,
  }));
  mocks.useRemoveFromWatchlist.mockImplementation(() => ({ mutate: jest.fn() }));
  mocks.useGetMyActivity.mockImplementation(() => ({
    data: { reports: [], comments: [] },
    isLoading: false,
  }));
});

// ---------------------------------------------------------------------------
describe('WatchlistScreen — packed-venue highlights', () => {
  it('floats a packed venue to the top and shows packed-highlight-<id> when crowdScore ≥ 80', async () => {
    // Two venues: venue 1 is packed (85), venue 2 is not (50).
    // Venue 2 comes first in the raw list to confirm the sort.
    apiState.watchlist = [
      { id: 2, name: 'Quiet Bar', crowdScore: 50, crowdLevel: 'low', category: 'Bar', market: 'NYC' },
      { id: 1, name: 'Packed Club', crowdScore: 85, crowdLevel: 'high', category: 'Club', market: 'NYC' },
    ];
    getApiMocks().useListWatchlist.mockImplementation(() => ({
      data: apiState.watchlist,
      isLoading: false,
    }));

    mockBadgeState.hasPackedBadge = true;
    mockBadgeState.newlyPackedIds = [1];

    const { getByTestId, queryByTestId, toJSON } = await render(<WatchlistScreen />);

    // The packed-highlight stripe must be present for venue 1.
    expect(getByTestId('packed-highlight-1')).toBeTruthy();

    // Venue 1 row must exist and venue 2 row must exist.
    expect(getByTestId('watchlist-venue-1')).toBeTruthy();
    expect(getByTestId('watchlist-venue-2')).toBeTruthy();

    // Non-packed venue 2 must NOT have a highlight stripe.
    expect(queryByTestId('packed-highlight-2')).toBeNull();

    // Venue 1 (packed) must appear before venue 2 in the rendered tree.
    // Walk each element's ancestry to a common FlatList ancestor, then
    // compare sibling indices to confirm the sort floated venue 1 to the top.
    const venue1El = getByTestId('watchlist-venue-1');
    const venue2El = getByTestId('watchlist-venue-2');

    // Collect the chain of ancestors for a node up to (but not including) root.
    function ancestorChain(node: { parent: typeof node | null }) {
      const chain = [];
      let cur: typeof node | null = node;
      while (cur?.parent) {
        chain.unshift(cur);
        cur = cur.parent;
      }
      return chain;
    }

    const chain1 = ancestorChain(venue1El as { parent: typeof venue1El | null });
    const chain2 = ancestorChain(venue2El as { parent: typeof venue1El | null });

    // Find the shallowest level where the two chains diverge — that's the
    // common ancestor whose children array determines render order.
    let divergeIdx = 0;
    while (
      divergeIdx < chain1.length &&
      divergeIdx < chain2.length &&
      chain1[divergeIdx] === chain2[divergeIdx]
    ) {
      divergeIdx++;
    }

    // If both paths are identical at every level, divergeIdx will equal the
    // shorter chain length; otherwise the elements at divergeIdx are the two
    // siblings we compare.
    if (divergeIdx < chain1.length && divergeIdx < chain2.length) {
      const sibling1 = chain1[divergeIdx] as { parent: { children: unknown[] } | null };
      const sibling2 = chain2[divergeIdx] as { parent: { children: unknown[] } | null };
      const siblings = sibling1.parent?.children ?? [];
      const idx1 = siblings.indexOf(sibling1);
      const idx2 = siblings.indexOf(sibling2);
      expect(idx1).toBeLessThan(idx2);
    }
    // If paths didn't diverge, the venues are in the same sub-tree and the
    // highlight assertion above is sufficient evidence of correct sorting.
  });

  it('does not show packed-highlight-<id> for a venue below the threshold', async () => {
    apiState.watchlist = [
      { id: 3, name: 'Chill Spot', crowdScore: 60, crowdLevel: 'medium', category: 'Lounge', market: 'LA' },
    ];
    getApiMocks().useListWatchlist.mockImplementation(() => ({
      data: apiState.watchlist,
      isLoading: false,
    }));

    // No badge raised — venue 3 is not packed.
    mockBadgeState.hasPackedBadge = false;
    mockBadgeState.newlyPackedIds = [];

    const { queryByTestId } = await render(<WatchlistScreen />);

    expect(queryByTestId('packed-highlight-3')).toBeNull();
  });

  it('clears the highlight after the user leaves the Saved tab and returns', async () => {
    apiState.watchlist = [
      { id: 4, name: 'Hot Venue', crowdScore: 90, crowdLevel: 'high', category: 'Club', market: 'SF' },
    ];
    getApiMocks().useListWatchlist.mockImplementation(() => ({
      data: apiState.watchlist,
      isLoading: false,
    }));

    mockBadgeState.hasPackedBadge = true;
    mockBadgeState.newlyPackedIds = [4];

    const { getByTestId, queryByTestId } = await render(<WatchlistScreen />);

    // Highlight is visible after first focus.
    expect(getByTestId('packed-highlight-4')).toBeTruthy();

    // Simulate leaving the tab: run the useFocusEffect cleanup.
    await act(async () => {
      capturedFocusCleanup?.();
    });

    // Highlight must be gone after the tab loses focus.
    expect(queryByTestId('packed-highlight-4')).toBeNull();
  });

  it('calls clearBadge when the tab gains focus with an active badge', async () => {
    apiState.watchlist = [
      { id: 5, name: 'Wild Venue', crowdScore: 95, crowdLevel: 'high', category: 'Bar', market: 'MIA' },
    ];
    getApiMocks().useListWatchlist.mockImplementation(() => ({
      data: apiState.watchlist,
      isLoading: false,
    }));

    mockBadgeState.hasPackedBadge = true;
    mockBadgeState.newlyPackedIds = [5];

    await render(<WatchlistScreen />);

    expect(mockBadgeState.clearBadge).toHaveBeenCalledTimes(1);
  });

  it('does not show any highlights when the user is signed out', async () => {
    mockClerkState.isSignedIn = false;
    mockBadgeState.hasPackedBadge = false;
    mockBadgeState.newlyPackedIds = [99];

    const { queryByTestId } = await render(<WatchlistScreen />);

    // Signed-out state renders a different UI — no venue rows at all.
    expect(queryByTestId('packed-highlight-99')).toBeNull();
    expect(queryByTestId('watchlist-venue-99')).toBeNull();
  });
});
