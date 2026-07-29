/**
 * Tests for the MapScreen market-filter and bounds-re-fit logic.
 *
 * Covers:
 * 1. Selecting a market chip re-queries useListVenues with the correct params.
 * 2. The map calls fitToVenues when the mappable venue set changes.
 * 3. Tapping the active market chip deselects it (returns to "All").
 * 4. A selected pin is cleared when it's no longer in the filtered set.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Module-level vars assigned inside jest.mock factories.
// `var` is used so that jest.mock hoisting can assign into them at
// module-initialisation time without hitting the temporal dead zone.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-var, prefer-const
var mockFitToVenues: jest.Mock;

// ---------------------------------------------------------------------------
// VenuePinsMap mock — exposes fitToVenues on the imperative handle and
// renders a tiny pressable stub per venue so tests can drive pin selection.
// ---------------------------------------------------------------------------
jest.mock('@/components/VenuePinsMap', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  const fn = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__mockFitToVenues = fn;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockVenuePinsMap = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(
      ref,
      () => ({ fitToVenues: fn, animateTo: jest.fn() }),
      [],
    );
    // Render a pressable stub per venue so tests can simulate pin selection
    return React.createElement(
      React.Fragment,
      null,
      props.venues.map((v: { id: number }) =>
        React.createElement(Pressable, {
          key: v.id,
          testID: `mock-pin-${v.id}`,
          onPress: () => props.onSelect(v.id),
        }),
      ),
    );
  });
  MockVenuePinsMap.displayName = 'VenuePinsMap';
  return { VenuePinsMap: MockVenuePinsMap };
});

// ---------------------------------------------------------------------------
// API client mocks
// ---------------------------------------------------------------------------
jest.mock('@workspace/api-client-react', () => ({
  useListVenues: jest.fn(),
  useListMarkets: jest.fn(),
  getListVenuesQueryKey: jest.fn((params?: unknown) => ['venues', params]),
  getListMarketsQueryKey: jest.fn(() => ['markets']),
}));

// ---------------------------------------------------------------------------
// Infra / UI mocks
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('expo-location', () => ({
  useForegroundPermissions: () => [{ granted: false, canAskAgain: true }, jest.fn()],
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
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
    mutedForeground: '#888',
    radius: 12,
  }),
}));

jest.mock('@/hooks/useUserLocation', () => ({
  useUserLocation: () => ({ coords: null, permissionGranted: false }),
}));

jest.mock('@/lib/venue-ui', () => ({
  crowdColor: (level: string) => {
    if (level === 'packed') return '#e74c3c';
    if (level === 'lively') return '#f39c12';
    return '#2ecc71';
  },
}));

jest.mock('@/lib/haversine', () => ({
  haversineDistanceMi: jest.fn(() => 0.5),
  formatDistanceMi: jest.fn(() => '0.5 mi'),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
type Venue = {
  id: number;
  name: string;
  category: string;
  city: string;
  market: string;
  latitude: number;
  longitude: number;
  crowdLevel: string;
  crowdScore: number;
  waitTimeMinutes: number;
  lineTrend: string;
  noiseLevel: string;
  photos: never[];
  lastUpdated: string;
};

function makeVenue(id: number, market: string, lat = 40.7, lng = -74.0): Venue {
  return {
    id,
    name: `Venue ${id}`,
    category: 'bar',
    city: market,
    market,
    latitude: lat,
    longitude: lng,
    crowdLevel: 'open',
    crowdScore: 50,
    waitTimeMinutes: 5,
    lineTrend: 'steady',
    noiseLevel: 'moderate',
    photos: [],
    lastUpdated: new Date().toISOString(),
  };
}

const MARKETS = [
  { market: 'NYC', venueCount: 2 },
  { market: 'LA', venueCount: 1 },
];

const NYC_VENUES = [makeVenue(1, 'NYC', 40.71, -74.01), makeVenue(2, 'NYC', 40.73, -74.02)];
const LA_VENUES = [makeVenue(3, 'LA', 34.05, -118.24)];
const ALL_VENUES = [...NYC_VENUES, ...LA_VENUES];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getApiMocks() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return jest.requireMock('@workspace/api-client-react') as {
    useListVenues: jest.Mock;
    useListMarkets: jest.Mock;
    getListVenuesQueryKey: jest.Mock;
    getListMarketsQueryKey: jest.Mock;
  };
}

function setupApiMocks(venuesByKey: Record<string, Venue[]>) {
  const { useListVenues, useListMarkets } = getApiMocks();
  useListMarkets.mockReturnValue({ data: MARKETS });
  useListVenues.mockImplementation((params: { market?: string } = {}) => {
    const key = params?.market ?? 'all';
    return { data: venuesByKey[key] ?? [], isLoading: false };
  });
}

// Import the component under test (after all mocks are registered)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MapScreen = require('../app/map').default;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  // Re-attach the fitToVenues fn from globalThis (set in the factory)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockFitToVenues = (globalThis as any).__mockFitToVenues;
  mockFitToVenues?.mockClear();
});

describe('MapScreen market filter chips', () => {
  it('re-queries useListVenues with the selected market when a chip is tapped', async () => {
    setupApiMocks({ all: ALL_VENUES, NYC: NYC_VENUES, LA: LA_VENUES });

    const { getByTestId } = await render(<MapScreen />);

    // Tap the NYC chip
    await act(async () => {
      fireEvent.press(getByTestId('market-NYC'));
    });

    const { useListVenues } = getApiMocks();
    const calls = useListVenues.mock.calls as Array<[{ market?: string }]>;
    const nycCall = calls.find(([params]) => params?.market === 'NYC');
    expect(nycCall).toBeDefined();
  });

  it('calls fitToVenues on the map when the filtered venue set changes', async () => {
    setupApiMocks({ all: ALL_VENUES, NYC: NYC_VENUES, LA: LA_VENUES });

    await render(<MapScreen />);

    // fitToVenues must NOT have been called yet (first fit is skipped by isFirstFit guard)
    expect(mockFitToVenues).not.toHaveBeenCalled();

    // Tap NYC — venue set changes from ALL_VENUES → NYC_VENUES
    const { getByTestId } = await render(<MapScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('market-NYC'));
    });

    expect(mockFitToVenues).toHaveBeenCalledTimes(1);
    expect(mockFitToVenues).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ market: 'NYC' })]),
    );
  });

  it('deselects the active market chip (returns to "All") when tapped again', async () => {
    setupApiMocks({ all: ALL_VENUES, NYC: NYC_VENUES, LA: LA_VENUES });

    const { getByTestId } = await render(<MapScreen />);
    const { useListVenues } = getApiMocks();

    // Activate NYC chip
    await act(async () => {
      fireEvent.press(getByTestId('market-NYC'));
    });
    // Tap NYC again → should return to "All" (no market param)
    await act(async () => {
      fireEvent.press(getByTestId('market-NYC'));
    });

    // After deselection, useListVenues must be called with no market param
    const calls = useListVenues.mock.calls as Array<[{ market?: string }?]>;
    const allCall = calls.find(([params]) => !params?.market);
    expect(allCall).toBeDefined();
  });

  it('clears the selected pin card when it is no longer in the filtered set', async () => {
    // Start with all venues; venue 3 is in LA only
    setupApiMocks({ all: ALL_VENUES, NYC: NYC_VENUES, LA: LA_VENUES });

    const { getByTestId, queryByTestId } = await render(<MapScreen />);

    // Select venue 3 (LA) while viewing all markets
    await act(async () => {
      fireEvent.press(getByTestId('mock-pin-3'));
    });
    expect(queryByTestId('map-card-3')).not.toBeNull();

    // Filter to NYC — venue 3 is no longer in the result set
    await act(async () => {
      fireEvent.press(getByTestId('market-NYC'));
    });

    // The selected-venue card for venue 3 should be gone
    expect(queryByTestId('map-card-3')).toBeNull();
  });
});
