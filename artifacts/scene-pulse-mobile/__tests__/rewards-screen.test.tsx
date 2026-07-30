/**
 * Tests for the RewardsScreen zero-state and signed-out gate.
 *
 * Covers:
 * 1. Signed-out gate: shows sign-in prompt; rewards content is absent.
 * 2. Loading state: skeleton blocks appear while API data is in flight.
 * 3. Zero-state (freshly signed-in user, 0 pts, Scout level):
 *    - Level card shows 0 points and "Scout"
 *    - Progress bar region is rendered (Scout → Regular)
 *    - Referral card is visible with the user's code
 *    - "RECENT ACTIVITY" section is hidden (no transactions)
 *    - "HOW TO EARN POINTS" section is always visible
 * 4. With transactions: "RECENT ACTIVITY" section appears.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// expo-router mock
// ---------------------------------------------------------------------------
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

// ---------------------------------------------------------------------------
// Mutable auth state — adjusted per-test
// (prefixed with `mock` so jest.mock() factories may reference them)
// ---------------------------------------------------------------------------
const mockClerkState = { isSignedIn: true as boolean | null | undefined };

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: mockClerkState.isSignedIn }),
}));

// ---------------------------------------------------------------------------
// API client mocks
// ---------------------------------------------------------------------------
jest.mock('@workspace/api-client-react', () => ({
  useGetMyRewards: jest.fn(),
  useGetMyReferralCode: jest.fn(),
  useRedeemReferral: jest.fn(),
}));

function getApiMocks() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return jest.requireMock('@workspace/api-client-react') as {
    useGetMyRewards: jest.Mock;
    useGetMyReferralCode: jest.Mock;
    useRedeemReferral: jest.Mock;
  };
}

// ---------------------------------------------------------------------------
// Infra / UI mocks
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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
    destructive: '#ef4444',
    radius: 8,
  }),
}));

// ---------------------------------------------------------------------------
// react-native Share mock (used inside ReferralCard)
// ---------------------------------------------------------------------------
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
}));

// ---------------------------------------------------------------------------
// Component under test — loaded after all mocks are registered
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RewardsScreen = (require('../app/rewards') as { default: React.FC }).default;

// ---------------------------------------------------------------------------
// Shared zero-state fixture
// ---------------------------------------------------------------------------
const ZERO_REWARDS = {
  points: 0,
  level: 'Scout',
  nextLevel: 'Regular',
  pointsToNextLevel: 100,
  transactions: [],
};

const ZERO_REFERRAL = {
  code: 'ABC12345',
  usesCount: 0,
};

// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  mockClerkState.isSignedIn = true;

  const mocks = getApiMocks();
  mocks.useGetMyRewards.mockReturnValue({ data: ZERO_REWARDS, isLoading: false });
  mocks.useGetMyReferralCode.mockReturnValue({ data: ZERO_REFERRAL, isLoading: false });
  mocks.useRedeemReferral.mockReturnValue({ mutate: jest.fn(), isPending: false });
});

// ---------------------------------------------------------------------------
describe('RewardsScreen — signed-out gate', () => {
  it('shows the sign-in prompt when the user is not authenticated', async () => {
    mockClerkState.isSignedIn = false;

    const { getByText } = await render(<RewardsScreen />);

    // Gate heading and CTA must be visible.
    expect(getByText('Sign in to see your rewards')).toBeTruthy();
    expect(getByText('Sign in to get started')).toBeTruthy();
  });

  it('does not render the level card or referral card when signed out', async () => {
    mockClerkState.isSignedIn = false;

    const { queryByText } = await render(<RewardsScreen />);

    // Rewards-only text should be absent.
    expect(queryByText('CURRENT LEVEL')).toBeNull();
    expect(queryByText('Refer friends')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('RewardsScreen — loading state', () => {
  it('does not render the level card while rewards are loading', async () => {
    getApiMocks().useGetMyRewards.mockReturnValue({ data: undefined, isLoading: true });
    getApiMocks().useGetMyReferralCode.mockReturnValue({ data: undefined, isLoading: true });

    const { queryByText } = await render(<RewardsScreen />);

    // Level card content must not appear while loading.
    expect(queryByText('CURRENT LEVEL')).toBeNull();
    // The page title is still shown even during loading.
    expect(queryByText(/ScenePulse Rewards/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
describe('RewardsScreen — zero-state (freshly signed-in user)', () => {
  it('shows 0 points in the level card', async () => {
    const { getByText } = await render(<RewardsScreen />);

    expect(getByText('0')).toBeTruthy();
  });

  it('shows the Scout level in the level card', async () => {
    const { getAllByText } = await render(<RewardsScreen />);

    // "Scout" appears as the level name (inside LevelCard).
    const scoutElements = getAllByText('Scout');
    expect(scoutElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the progress label toward Regular', async () => {
    const { getByText, getAllByText } = await render(<RewardsScreen />);

    // pointsToNextLevel = 100, text includes "100 pts to"
    expect(getByText(/100.*pts to/)).toBeTruthy();
    // "Regular" appears as the end-label of the progress bar (and possibly
    // inside the inline text node) — getAllByText handles multiple occurrences.
    const regularEls = getAllByText('Regular');
    expect(regularEls.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the referral card with the user\'s code', async () => {
    const { getByText } = await render(<RewardsScreen />);

    expect(getByText('ABC12345')).toBeTruthy();
    expect(getByText('Refer friends')).toBeTruthy();
  });

  it('does not show "RECENT ACTIVITY" when there are no transactions', async () => {
    const { queryByText } = await render(<RewardsScreen />);

    expect(queryByText('RECENT ACTIVITY')).toBeNull();
  });

  it('always shows the "HOW TO EARN POINTS" section', async () => {
    const { getByText } = await render(<RewardsScreen />);

    expect(getByText('HOW TO EARN POINTS')).toBeTruthy();
    // At least one earn row should be visible.
    expect(getByText('Submit a live report')).toBeTruthy();
    expect(getByText('Refer a friend')).toBeTruthy();
  });

  it('shows the redeem-a-code card', async () => {
    const { getByText } = await render(<RewardsScreen />);

    expect(getByText('Have a referral code?')).toBeTruthy();
  });

  it('does not show "Used by X friends" when usesCount is 0', async () => {
    const { queryByText } = await render(<RewardsScreen />);

    expect(queryByText(/Used by/)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('RewardsScreen — with transaction history', () => {
  it('shows "RECENT ACTIVITY" section when the user has transactions', async () => {
    getApiMocks().useGetMyRewards.mockReturnValue({
      data: {
        points: 10,
        level: 'Scout',
        nextLevel: 'Regular',
        pointsToNextLevel: 90,
        transactions: [
          { id: 'tx-1', points: 10, reason: 'report', createdAt: new Date().toISOString() },
        ],
      },
      isLoading: false,
    });

    const { getByText } = await render(<RewardsScreen />);

    expect(getByText('RECENT ACTIVITY')).toBeTruthy();
    // Transaction row text from REASON_LABEL
    expect(getByText('Submitted a live report')).toBeTruthy();
  });

  it('shows the correct signed point value for a positive transaction', async () => {
    getApiMocks().useGetMyRewards.mockReturnValue({
      data: {
        points: 10,
        level: 'Scout',
        nextLevel: 'Regular',
        pointsToNextLevel: 90,
        transactions: [
          { id: 'tx-2', points: 10, reason: 'report', createdAt: new Date().toISOString() },
        ],
      },
      isLoading: false,
    });

    const { getByText } = await render(<RewardsScreen />);

    // TransactionRow prepends "+" for positive values.
    expect(getByText('+10')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Fixture shared by the "first points earned" suite
// ---------------------------------------------------------------------------
const FIRST_POINTS_REWARDS = {
  points: 10,
  level: 'Scout',
  nextLevel: 'Regular',
  pointsToNextLevel: 90,
  transactions: [
    { id: 'tx-first', points: 10, reason: 'report', createdAt: new Date('2026-07-30T12:00:00Z').toISOString() },
  ],
};

// ---------------------------------------------------------------------------
describe('RewardsScreen — after earning first points (10 pts, Scout, 1 report)', () => {
  beforeEach(() => {
    getApiMocks().useGetMyRewards.mockReturnValue({
      data: FIRST_POINTS_REWARDS,
      isLoading: false,
    });
  });

  it('shows the updated point total (10) in the level card', async () => {
    const { getByText } = await render(<RewardsScreen />);

    // Points are rendered via toLocaleString(); "10" must appear in the level card.
    expect(getByText('10')).toBeTruthy();
  });

  it('shows the first transaction row in RECENT ACTIVITY', async () => {
    const { getByText } = await render(<RewardsScreen />);

    expect(getByText('RECENT ACTIVITY')).toBeTruthy();
    expect(getByText('Submitted a live report')).toBeTruthy();
    expect(getByText('+10')).toBeTruthy();
  });

  it('shows a non-zero progress bar when points > 0', async () => {
    const { getByTestId } = await render(<RewardsScreen />);

    // The progress fill width is set as a percentage string ("10%").
    // For 10 pts Scout→Regular (threshold 100), progressPct = 10.
    const fill = getByTestId('progress-fill');
    const widthStyle = (fill.props.style as Array<Record<string, unknown>>)
      .reduce<Record<string, unknown>>((acc, s) => ({ ...acc, ...(s as object) }), {});
    const widthValue = widthStyle.width as string;

    expect(widthValue).toBeDefined();
    const numeric = parseFloat(widthValue);
    expect(numeric).toBeGreaterThan(0);
  });
});
