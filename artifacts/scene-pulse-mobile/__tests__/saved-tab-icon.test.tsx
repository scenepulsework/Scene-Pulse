/**
 * Tests for the SavedTabIcon component in the tab bar layout.
 *
 * Covers:
 * 1. The red badge dot is rendered when `hasPackedBadge` is true.
 * 2. No badge dot is rendered when `hasPackedBadge` is false.
 *
 * `useWatchlistBadge` is mocked directly so these tests are independent of
 * WatchlistBadgeContext logic.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mock useWatchlistBadge — the only context dependency of SavedTabIcon.
// ---------------------------------------------------------------------------
const badgeState = { hasPackedBadge: false };

jest.mock('@/contexts/WatchlistBadgeContext', () => ({
  useWatchlistBadge: () => ({
    hasPackedBadge: badgeState.hasPackedBadge,
    newlyPackedIds: [],
    clearBadge: jest.fn(),
  }),
}));

// Mock @expo/vector-icons so Feather renders without native modules.
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

// Mock expo-router so the Tabs import doesn't pull in native navigators.
jest.mock('expo-router', () => ({
  Tabs: 'Tabs',
}));

// Mock react-native-safe-area-context (used by TabLayout, not SavedTabIcon,
// but needed for the module to load).
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

// Mock @/hooks/useColors (used by TabLayout, not SavedTabIcon, but needed for
// the module to load).
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    card: '#fff',
    border: '#ccc',
    primary: '#000',
    mutedForeground: '#999',
  }),
}));

// ---------------------------------------------------------------------------
// Component under test — loaded after mocks are registered.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SavedTabIcon } = require('../app/(tabs)/_layout') as {
  SavedTabIcon: React.FC<{ color: string }>;
};

// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  badgeState.hasPackedBadge = false;
});

// ---------------------------------------------------------------------------
describe('SavedTabIcon', () => {
  it('renders the red badge dot when hasPackedBadge is true', async () => {
    badgeState.hasPackedBadge = true;

    const { getByTestId } = await render(<SavedTabIcon color="#000" />);

    // The badge dot View must be present in the tree.
    expect(getByTestId('saved-tab-badge-dot')).toBeTruthy();
  });

  it('does not render the red badge dot when hasPackedBadge is false', async () => {
    badgeState.hasPackedBadge = false;

    const { queryByTestId } = await render(<SavedTabIcon color="#000" />);

    // The badge dot View must not be present in the tree.
    expect(queryByTestId('saved-tab-badge-dot')).toBeNull();
  });
});
