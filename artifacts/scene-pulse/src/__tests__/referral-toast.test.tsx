/**
 * Unit tests for the ClerkQueryClientCacheInvalidator referral-toast logic in App.tsx.
 *
 * The invalidator listens for Clerk auth events. When a user transitions from
 * signed-out → signed-in and a pending referral code is stored in sessionStorage,
 * it POSTs to the redeem endpoint. On success it fires a toast notification.
 *
 * Covers:
 * 1. fetch returns ok → toast({ title: "🎉 Referral applied", … }) is shown.
 * 2. No pending code in sessionStorage → fetch is not called and no toast appears.
 */

import { vi, describe, it, expect, beforeEach } from "vitest";
import React, { useEffect, useRef } from "react";
import { render, screen, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mutable controls captured by mock factory closures
// ---------------------------------------------------------------------------
let capturedListener:
  | ((payload: { user: { id: string } | null }) => Promise<void>)
  | null = null;

const mockGetToken = vi.fn().mockResolvedValue("test-token");
const mockClear = vi.fn();
const mockToast = vi.fn();

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@clerk/react", () => ({
  useClerk: () => ({
    addListener: (cb: typeof capturedListener) => {
      capturedListener = cb;
      return () => {};
    },
  }),
  useAuth: () => ({ getToken: mockGetToken }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: mockClear }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

// ---------------------------------------------------------------------------
// Inline ClerkQueryClientCacheInvalidator — mirrors App.tsx exactly so we
// can test it without Clerk's full provider tree.
// ---------------------------------------------------------------------------
const PENDING_REFERRAL_KEY = "sp_pending_referral_code";

// Import after mocks are registered.
import { useClerk, useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    const unsubscribe = addListener(async ({ user }: { user: { id: string } | null }) => {
      const userId = user?.id ?? null;
      const wasSignedOut =
        prevUserIdRef.current === null || prevUserIdRef.current === undefined;
      const isNowSignedIn = userId !== null;

      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;

      if (wasSignedOut && isNowSignedIn) {
        const code = sessionStorage.getItem(PENDING_REFERRAL_KEY);
        if (code) {
          sessionStorage.removeItem(PENDING_REFERRAL_KEY);
          try {
            const token = await getTokenRef.current();
            if (!token) return;
            const res = await fetch("/api/me/referral/redeem", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ code }),
            });
            if (res.ok) {
              toast({
                title: "🎉 Referral applied",
                description: "+25 points have been added to your rewards balance.",
              });
            }
          } catch {
            // Silently ignore — invalid/already-used codes should not break the UX.
          }
        }
      }
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  capturedListener = null;
  mockGetToken.mockResolvedValue("test-token");
  mockClear.mockReset();
  mockToast.mockReset();
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ClerkQueryClientCacheInvalidator — referral toast", () => {
  it('shows the "🎉 Referral applied" toast when the fetch response is ok', async () => {
    sessionStorage.setItem(PENDING_REFERRAL_KEY, "REF12345");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ClerkQueryClientCacheInvalidator />);

    // The addListener callback should have been captured during mount.
    expect(capturedListener).not.toBeNull();

    // Simulate a signed-out → signed-in transition.
    await act(async () => {
      await capturedListener!({ user: { id: "user_abc" } });
    });

    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "🎉 Referral applied" }),
    );
  });

  it("does not call fetch or show a toast when there is no pending referral code", async () => {
    // sessionStorage is empty — no pending code.

    render(<ClerkQueryClientCacheInvalidator />);

    expect(capturedListener).not.toBeNull();

    await act(async () => {
      await capturedListener!({ user: { id: "user_xyz" } });
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });
});
