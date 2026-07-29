/**
 * Tests for WatchlistBadgeContext packed-badge logic.
 *
 * Covers:
 * 1. Badge shows when a watchlisted venue has crowdScore ≥ 80 (signed in).
 * 2. Badge does NOT show when the user is signed out.
 * 3. Badge does NOT show when all venues have crowdScore < 80.
 * 4. Badge clears after clearBadge() is called (simulates navigating to Saved tab).
 * 5. Badge re-raises when a new packed venue appears after the user already cleared it.
 */

import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mutable control objects — captured by reference inside mock closures so
// individual tests can adjust state without re-requiring the mocks.
// ---------------------------------------------------------------------------
const clerkState = { isSignedIn: true };

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: clerkState.isSignedIn }),
}));

type WatchlistItem = { id: number; crowdScore: number };
const apiState: { watchlist: WatchlistItem[] } = { watchlist: [] };

jest.mock('@workspace/api-client-react', () => ({
  useListWatchlist: jest.fn(),
  getListWatchlistQueryKey: jest.fn(() => ['watchlist']),
}));

function getApiMocks() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return jest.requireMock('@workspace/api-client-react') as {
    useListWatchlist: jest.Mock;
  };
}

// ---------------------------------------------------------------------------
// Component under test is loaded after mocks are registered
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { WatchlistBadgeProvider, useWatchlistBadge } = require('../contexts/WatchlistBadgeContext') as {
  WatchlistBadgeProvider: React.FC<{ children: React.ReactNode }>;
  useWatchlistBadge: () => { hasPackedBadge: boolean; clearBadge: () => void };
};

// ---------------------------------------------------------------------------
// Minimal consumer that renders testable output driven by the context value.
// ---------------------------------------------------------------------------
function BadgeConsumer() {
  const { hasPackedBadge, clearBadge } = useWatchlistBadge();
  return (
    <>
      <Text testID="badge-status">{hasPackedBadge ? 'visible' : 'hidden'}</Text>
      <Pressable testID="clear-badge" onPress={clearBadge}>
        <Text>Clear</Text>
      </Pressable>
    </>
  );
}

// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  clerkState.isSignedIn = true;
  apiState.watchlist = [];
  getApiMocks().useListWatchlist.mockImplementation(() => ({ data: apiState.watchlist }));
});

// ---------------------------------------------------------------------------
describe('WatchlistBadgeContext', () => {
  it('shows badge when signed in and a venue has crowdScore ≥ 80', async () => {
    apiState.watchlist = [{ id: 1, crowdScore: 85 }];

    const { getByTestId } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('visible');
  });

  it('does not show badge when signed out', async () => {
    clerkState.isSignedIn = false;
    apiState.watchlist = [{ id: 1, crowdScore: 95 }];

    const { getByTestId } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('hidden');
  });

  it('does not show badge when all venues have crowdScore < 80', async () => {
    apiState.watchlist = [
      { id: 1, crowdScore: 50 },
      { id: 2, crowdScore: 79 },
    ];

    const { getByTestId } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('hidden');
  });

  it('does not show badge at threshold boundary crowdScore = 79', async () => {
    apiState.watchlist = [{ id: 1, crowdScore: 79 }];

    const { getByTestId } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('hidden');
  });

  it('shows badge at threshold boundary crowdScore = 80', async () => {
    apiState.watchlist = [{ id: 1, crowdScore: 80 }];

    const { getByTestId } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('visible');
  });

  it('clears badge when navigating to the Saved tab (clearBadge called)', async () => {
    apiState.watchlist = [{ id: 1, crowdScore: 85 }];

    const { getByTestId } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('visible');

    await act(async () => {
      fireEvent.press(getByTestId('clear-badge'));
    });

    expect(getByTestId('badge-status').props.children).toBe('hidden');
  });

  it('re-raises badge when a new packed venue appears after the user cleared it', async () => {
    // Start with one packed venue.
    apiState.watchlist = [{ id: 1, crowdScore: 85 }];
    const { useListWatchlist } = getApiMocks();

    const { getByTestId, rerender } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    // Badge is visible.
    expect(getByTestId('badge-status').props.children).toBe('visible');

    // User navigates to Saved tab → badge is cleared.
    await act(async () => {
      fireEvent.press(getByTestId('clear-badge'));
    });
    expect(getByTestId('badge-status').props.children).toBe('hidden');

    // All scores drop — no packed venue.
    apiState.watchlist = [{ id: 1, crowdScore: 40 }];
    useListWatchlist.mockImplementation(() => ({ data: apiState.watchlist }));
    await act(async () => {
      rerender(
        <WatchlistBadgeProvider>
          <BadgeConsumer />
        </WatchlistBadgeProvider>,
      );
    });
    expect(getByTestId('badge-status').props.children).toBe('hidden');

    // A new packed venue appears after the lull.
    apiState.watchlist = [{ id: 1, crowdScore: 40 }, { id: 2, crowdScore: 90 }];
    useListWatchlist.mockImplementation(() => ({ data: apiState.watchlist }));
    await act(async () => {
      rerender(
        <WatchlistBadgeProvider>
          <BadgeConsumer />
        </WatchlistBadgeProvider>,
      );
    });

    // Badge must be raised again.
    expect(getByTestId('badge-status').props.children).toBe('visible');
  });

  it('clears badge when the only packed venue is removed from the watchlist', async () => {
    // Start with one packed venue — badge is raised.
    apiState.watchlist = [{ id: 1, crowdScore: 85 }];
    const { useListWatchlist } = getApiMocks();

    const { getByTestId, rerender } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('visible');

    // Remove the only packed venue from the watchlist.
    apiState.watchlist = [];
    useListWatchlist.mockImplementation(() => ({ data: apiState.watchlist }));
    await act(async () => {
      rerender(
        <WatchlistBadgeProvider>
          <BadgeConsumer />
        </WatchlistBadgeProvider>,
      );
    });

    // Badge must clear immediately — no packed venues remain.
    expect(getByTestId('badge-status').props.children).toBe('hidden');
  });

  it('does not show badge when the watchlist is empty', async () => {
    apiState.watchlist = [];

    const { getByTestId } = await render(
      <WatchlistBadgeProvider>
        <BadgeConsumer />
      </WatchlistBadgeProvider>,
    );

    expect(getByTestId('badge-status').props.children).toBe('hidden');
  });
});
