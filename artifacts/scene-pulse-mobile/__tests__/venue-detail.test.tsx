/**
 * Tests for the VenueDetailScreen distance display.
 *
 * Covers:
 * 1. Distance text ("X mi away") is shown when user coords are available.
 * 2. No distance text is shown when coords are absent (permission not granted).
 * 3. Distance text appears after coords become available mid-session
 *    (simulates the user granting location permission while the screen is open).
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Module-level mutable state for hooks that tests need to control
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-var
var mockUseUserLocation: jest.Mock;

// ---------------------------------------------------------------------------
// API client mocks
// ---------------------------------------------------------------------------
jest.mock('@workspace/api-client-react', () => ({
  useGetVenue: jest.fn(),
  useListVenueReports: jest.fn(),
  useListWatchlist: jest.fn(),
  useAddToWatchlist: jest.fn(),
  useRemoveFromWatchlist: jest.fn(),
  getGetVenueQueryKey: jest.fn((id: number) => ['venue', id]),
  getListVenueReportsQueryKey: jest.fn((id: number) => ['reports', id]),
  getListWatchlistQueryKey: jest.fn(() => ['watchlist']),
}));

// ---------------------------------------------------------------------------
// Infra / UI mocks
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '42' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: false }),
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
    secondary: '#00B894',
    secondaryForeground: '#fff',
    accent: '#fd79a8',
    mutedForeground: '#888',
    destructive: '#e17055',
    success: '#00B894',
    radius: 12,
  }),
}));

jest.mock('@/components/VenueCard', () => ({
  CrowdDot: () => null,
}));

jest.mock('@/components/VenueComments', () => ({
  VenueComments: () => null,
}));

jest.mock('@/lib/venue-ui', () => ({
  crowdColor: () => '#6C5CE7',
  timeAgo: () => '2m ago',
  trendLabel: () => 'steady',
}));

jest.mock('@/hooks/useUserLocation', () => ({
  useUserLocation: jest.fn(() => ({
    coords: null,
    permissionGranted: false,
    canAskPermission: true,
    requestPermission: jest.fn(),
    promptDismissed: false,
    dismissPrompt: jest.fn(),
  })),
}));

jest.mock('@/lib/haversine', () => ({
  haversineDistanceMi: jest.fn(() => 1.3),
  formatDistanceMi: jest.fn(() => '1.3 mi'),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const VENUE = {
  id: 42,
  name: 'Test Venue',
  category: 'bar',
  market: 'NYC',
  city: 'New York',
  address: '123 Main St',
  latitude: 40.71,
  longitude: -74.01,
  rating: 4.5,
  crowdScore: 72,
  crowdLevel: 'lively',
  waitTimeMinutes: 10,
  headcount: 85,
  lineTrend: 'rising',
  seatingOdds: 'low',
  noiseLevel: 'loud',
  coverCost: 'none',
  bestTimeWindow: '9pm–11pm',
  peakPressureWindow: '11pm–1am',
  reservationSignal: 'Walk-ins welcome before 9pm.',
  arrivalTips: [],
  photos: [],
  openingHours: null,
  mapsUrl: null,
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getApiMocks() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return jest.requireMock('@workspace/api-client-react') as {
    useGetVenue: jest.Mock;
    useListVenueReports: jest.Mock;
    useListWatchlist: jest.Mock;
    useAddToWatchlist: jest.Mock;
    useRemoveFromWatchlist: jest.Mock;
  };
}

function setupApiMocks() {
  const { useGetVenue, useListVenueReports, useListWatchlist, useAddToWatchlist, useRemoveFromWatchlist } =
    getApiMocks();
  useGetVenue.mockReturnValue({ data: VENUE, isLoading: false });
  useListVenueReports.mockReturnValue({ data: [] });
  useListWatchlist.mockReturnValue({ data: [] });
  useAddToWatchlist.mockReturnValue({ mutate: jest.fn(), isPending: false });
  useRemoveFromWatchlist.mockReturnValue({ mutate: jest.fn(), isPending: false });
}

function getUserLocationMock() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (jest.requireMock('@/hooks/useUserLocation') as { useUserLocation: jest.Mock }).useUserLocation;
}

// Import after all mocks are registered
// eslint-disable-next-line @typescript-eslint/no-require-imports
const VenueDetailScreen = require('../app/venue/[id]').default;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  setupApiMocks();

  mockUseUserLocation = getUserLocationMock();
  mockUseUserLocation.mockReturnValue({
    coords: null,
    permissionGranted: false,
    canAskPermission: true,
    requestPermission: jest.fn(),
    promptDismissed: false,
    dismissPrompt: jest.fn(),
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('VenueDetailScreen distance display', () => {
  it('shows the distance text when user coords are available', async () => {
    mockUseUserLocation.mockReturnValue({
      coords: { latitude: 40.7, longitude: -74.0 },
      permissionGranted: true,
      canAskPermission: false,
      requestPermission: jest.fn(),
      promptDismissed: false,
      dismissPrompt: jest.fn(),
    });

    const { getByText } = await render(<VenueDetailScreen />);

    // formatDistanceMi is mocked to return '1.3 mi', component appends ' away'
    expect(getByText('1.3 mi away')).toBeTruthy();
  });

  it('does not show any distance text when coords are absent', async () => {
    // Default beforeEach mock has coords: null
    const { queryByText } = await render(<VenueDetailScreen />);

    expect(queryByText(/away/)).toBeNull();
  });

  it('shows distance text after coords become available mid-session', async () => {
    // Start with no coords (permission not yet granted)
    const { queryByText, rerender } = await render(<VenueDetailScreen />);
    expect(queryByText(/away/)).toBeNull();

    // Simulate user granting permission: hook now returns valid coords
    mockUseUserLocation.mockReturnValue({
      coords: { latitude: 40.7, longitude: -74.0 },
      permissionGranted: true,
      canAskPermission: false,
      requestPermission: jest.fn(),
      promptDismissed: false,
      dismissPrompt: jest.fn(),
    });

    await act(async () => {
      rerender(<VenueDetailScreen />);
    });

    expect(queryByText('1.3 mi away')).toBeTruthy();
  });
});
