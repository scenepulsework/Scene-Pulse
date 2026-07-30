/**
 * Referral-toast integration tests for ClerkAuthBridge.
 *
 * Unlike clerk-auth-bridge.test.tsx (which tests the redemption call itself),
 * these tests confirm that the *toast notification* surfaces to the user after
 * a successful redemption and stays absent when there is no pending code.
 *
 * Covers:
 * 1. redeemReferral resolves → "🎉 Referral applied — +25 points added!" is visible.
 * 2. No pending referral code in SecureStore → toast is NOT shown.
 */

// ---------------------------------------------------------------------------
// Mutable state captured by mock closures (must precede jest.mock() calls)
// ---------------------------------------------------------------------------
const mockAuthState = { isSignedIn: false as boolean | null | undefined };
const mockStore: Record<string, string> = {};
const mockRedeemReferral = jest.fn();

// ---------------------------------------------------------------------------
// Mock registrations — hoisted before imports
// ---------------------------------------------------------------------------
jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: mockAuthState.isSignedIn }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockStore[key] = value; }),
  deleteItemAsync: jest.fn(async (key: string) => { delete mockStore[key]; }),
}));

jest.mock('@workspace/api-client-react', () => ({
  setBaseUrl: jest.fn(),
  setAuthTokenGetter: jest.fn(),
  redeemReferral: (...args: unknown[]) => mockRedeemReferral(...args),
}));

// ToastProvider calls useSafeAreaInsets — provide a no-op stub.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are applied
// ---------------------------------------------------------------------------
import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react-native';
import { useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { redeemReferral } from '@workspace/api-client-react';
import { ToastProvider, useToast } from '../contexts/ToastContext';

// ---------------------------------------------------------------------------
// Inline ClerkAuthBridge — mirrors _layout.tsx exactly so we exercise the
// showToast call without needing the full Expo Router navigation tree.
// ---------------------------------------------------------------------------
const PENDING_REFERRAL_CODE_KEY = 'pending_referral_code';

function ClerkAuthBridge() {
  const { isSignedIn } = useAuth();
  const prevSignedInRef = useRef<boolean | undefined>(undefined);
  const { showToast } = useToast();

  useEffect(() => {
    if (isSignedIn && prevSignedInRef.current === false) {
      SecureStore.getItemAsync(PENDING_REFERRAL_CODE_KEY).then(async (code) => {
        if (!code) return;
        await SecureStore.deleteItemAsync(PENDING_REFERRAL_CODE_KEY).catch(() => {});
        try {
          await redeemReferral({ code });
          showToast('🎉 Referral applied — +25 points added!');
        } catch {
          // Silently ignore — invalid/already-used codes must not break the UX.
        }
      }).catch(() => {});
    }
    prevSignedInRef.current = isSignedIn;
  }, [isSignedIn, showToast]);

  return null;
}

function TestTree() {
  return (
    <ToastProvider>
      <ClerkAuthBridge />
    </ToastProvider>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function flushAsync() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.isSignedIn = false;
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ClerkAuthBridge — referral toast', () => {
  it('shows "🎉 Referral applied — +25 points added!" after a successful redemption', async () => {
    mockStore[PENDING_REFERRAL_CODE_KEY] = 'TOAST123';
    mockRedeemReferral.mockResolvedValue({ success: true, pointsEarned: 25 });

    const { rerender, getByText } = await render(<TestTree />);

    // Transition from signed-out → signed-in.
    mockAuthState.isSignedIn = true;
    await act(async () => {
      rerender(<TestTree />);
    });
    await flushAsync();

    expect(getByText('🎉 Referral applied — +25 points added!')).toBeTruthy();
  });

  it('does NOT show a toast when there is no pending referral code in SecureStore', async () => {
    // mockStore is empty — no code stored.
    mockRedeemReferral.mockResolvedValue({ success: true, pointsEarned: 25 });

    const { rerender, queryByText } = await render(<TestTree />);

    mockAuthState.isSignedIn = true;
    await act(async () => {
      rerender(<TestTree />);
    });
    await flushAsync();

    expect(queryByText('🎉 Referral applied — +25 points added!')).toBeNull();
    expect(mockRedeemReferral).not.toHaveBeenCalled();
  });
});
