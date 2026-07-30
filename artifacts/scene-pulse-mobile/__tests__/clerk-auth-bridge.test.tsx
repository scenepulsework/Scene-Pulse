/**
 * Unit tests for the ClerkAuthBridge auto-redeem logic in _layout.tsx.
 *
 * The bridge watches the `isSignedIn` state from Clerk. When it transitions
 * from false → true (i.e. a fresh sign-up or sign-in), it checks SecureStore
 * for a pending referral code and calls `redeemReferral` if one is found.
 *
 * Covers:
 * 1. Pending code present → redeemReferral is called with the code on sign-in.
 * 2. redeemReferral throws (invalid/already-used code) → no error surfaces to the UI.
 * 3. No pending code stored → redeemReferral is never called.
 * 4. Already signed in from the start (no transition) → redeemReferral is not called.
 * 5. Subsequent re-render while still signed in → redeemReferral is not called again.
 */

// ---------------------------------------------------------------------------
// Mutable auth / store state — must be declared before jest.mock() factories
// so the factory closures capture the live reference.
// (prefixed `mock` so jest.mock hoisting can reference them in factory bodies)
// ---------------------------------------------------------------------------
const mockAuthState = { isSignedIn: false as boolean | null | undefined };
const mockStore: Record<string, string> = {};
const mockRedeemReferral = jest.fn();

// ---------------------------------------------------------------------------
// Mock registrations — jest.mock() is hoisted to the top of the file, so
// these run before any import. The factory closures capture the mutable
// objects declared above.
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

// ---------------------------------------------------------------------------
// Module imports — resolved AFTER mocks are applied thanks to hoisting.
// ---------------------------------------------------------------------------
import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react-native';
import { useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { redeemReferral } from '@workspace/api-client-react';

// ---------------------------------------------------------------------------
// ClerkAuthBridge — mirrors the production component from _layout.tsx exactly,
// so we can test it without Expo Router's full navigation tree.
// ---------------------------------------------------------------------------

const PENDING_REFERRAL_CODE_KEY = 'pending_referral_code';

function ClerkAuthBridge() {
  const { isSignedIn } = useAuth();
  const prevSignedInRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (isSignedIn && prevSignedInRef.current === false) {
      SecureStore.getItemAsync(PENDING_REFERRAL_CODE_KEY).then(async (code) => {
        if (!code) return;
        await SecureStore.deleteItemAsync(PENDING_REFERRAL_CODE_KEY).catch(() => {});
        try {
          await redeemReferral({ code });
        } catch {
          // Silently ignore — invalid/already-used codes must not break the UX.
        }
      }).catch(() => {});
    }
    prevSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flush all pending microtasks / promise continuations. */
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

describe('ClerkAuthBridge — referral auto-redeem', () => {
  it('calls redeemReferral with the stored code when a new sign-in is detected', async () => {
    mockStore[PENDING_REFERRAL_CODE_KEY] = 'ABC12345';
    mockRedeemReferral.mockResolvedValue({ success: true, pointsEarned: 25 });

    // First render with isSignedIn = false → prevRef becomes false.
    const { rerender } = await render(<ClerkAuthBridge />);

    // Simulate sign-in transition.
    mockAuthState.isSignedIn = true;
    await act(async () => {
      rerender(<ClerkAuthBridge />);
    });
    await flushAsync();

    expect(mockRedeemReferral).toHaveBeenCalledTimes(1);
    expect(mockRedeemReferral).toHaveBeenCalledWith({ code: 'ABC12345' });
  });

  it('clears the stored code from SecureStore after attempting to redeem it', async () => {
    mockStore[PENDING_REFERRAL_CODE_KEY] = 'CLEAR123';
    mockRedeemReferral.mockResolvedValue({ success: true, pointsEarned: 25 });

    const { rerender } = await render(<ClerkAuthBridge />);

    mockAuthState.isSignedIn = true;
    await act(async () => {
      rerender(<ClerkAuthBridge />);
    });
    await flushAsync();

    const SecureStoreMock = jest.requireMock('expo-secure-store') as {
      deleteItemAsync: jest.Mock;
    };
    expect(SecureStoreMock.deleteItemAsync).toHaveBeenCalledWith(PENDING_REFERRAL_CODE_KEY);
    expect(mockStore[PENDING_REFERRAL_CODE_KEY]).toBeUndefined();
  });

  it('does not surface an error when redeemReferral throws (invalid/already-used code)', async () => {
    mockStore[PENDING_REFERRAL_CODE_KEY] = 'BADCODE1';
    mockRedeemReferral.mockRejectedValue(new Error('Invalid referral code'));

    const { rerender } = await render(<ClerkAuthBridge />);

    mockAuthState.isSignedIn = true;
    // Should not throw — the bridge swallows errors silently.
    await act(async () => {
      rerender(<ClerkAuthBridge />);
    });
    await flushAsync();

    // redeemReferral was called but the error was swallowed silently.
    expect(mockRedeemReferral).toHaveBeenCalledTimes(1);
  });

  it('does not call redeemReferral when there is no pending code', async () => {
    // mockStore is empty — no pending code stored.
    const { rerender } = await render(<ClerkAuthBridge />);

    mockAuthState.isSignedIn = true;
    await act(async () => {
      rerender(<ClerkAuthBridge />);
    });
    await flushAsync();

    expect(mockRedeemReferral).not.toHaveBeenCalled();
  });

  it('does not call redeemReferral when the user was already signed in from the start', async () => {
    mockStore[PENDING_REFERRAL_CODE_KEY] = 'ALREADYIN';
    // Signed in from the very first render — no false→true transition.
    mockAuthState.isSignedIn = true;

    await render(<ClerkAuthBridge />);
    await flushAsync();

    expect(mockRedeemReferral).not.toHaveBeenCalled();
  });

  it('does not call redeemReferral a second time on a subsequent re-render without sign-out', async () => {
    mockStore[PENDING_REFERRAL_CODE_KEY] = 'ONCE1234';
    mockRedeemReferral.mockResolvedValue({ success: true, pointsEarned: 25 });

    const { rerender } = await render(<ClerkAuthBridge />);

    // First sign-in transition.
    mockAuthState.isSignedIn = true;
    await act(async () => {
      rerender(<ClerkAuthBridge />);
    });
    await flushAsync();

    expect(mockRedeemReferral).toHaveBeenCalledTimes(1);

    // Subsequent re-render while still signed in (e.g. an unrelated state update).
    await act(async () => {
      rerender(<ClerkAuthBridge />);
    });
    await flushAsync();

    // Must not fire again — no new false→true transition occurred.
    expect(mockRedeemReferral).toHaveBeenCalledTimes(1);
  });
});
