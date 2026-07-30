import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setBaseUrl, setAuthTokenGetter, redeemReferral } from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { registerBackgroundFetch } from '@/lib/backgroundFetch';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { PENDING_REFERRAL_CODE_KEY } from './sign-up';
import { PushNotificationsProvider } from '@/contexts/PushNotificationsContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { WatchlistBadgeProvider } from '@/contexts/WatchlistBadgeContext';
import { Sidebar } from '@/components/Sidebar';
import { ToastProvider, useToast } from '@/contexts/ToastContext';

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try { return await SecureStore.getItemAsync(key); }
    catch { await SecureStore.deleteItemAsync(key).catch(() => {}); return null; }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  async clearToken(key: string): Promise<void> {
    try { await SecureStore.deleteItemAsync(key); } catch {}
  },
};

function ClerkAuthBridge() {
  const { getToken, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { showToast } = useToast();

  // Wire Clerk token into the API client.
  useEffect(() => {
    setAuthTokenGetter(() => getTokenRef.current());
    return () => setAuthTokenGetter(null);
  }, []);

  // After sign-up, a referral code may be stored waiting for a valid session.
  // Redeem it now that the session is active and the API client has a token.
  const prevSignedInRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (isSignedIn && prevSignedInRef.current === false) {
      // Transitioned from signed-out → signed-in (i.e. a fresh sign-up / sign-in).
      SecureStore.getItemAsync(PENDING_REFERRAL_CODE_KEY).then(async (code) => {
        if (!code) return;
        // Always clear the key first so we don't retry on error.
        await SecureStore.deleteItemAsync(PENDING_REFERRAL_CODE_KEY).catch(() => {});
        try {
          await redeemReferral({ code });
          showToast('🎉 Referral applied — +25 points added!');
        } catch {
          // Silently ignore — invalid/already-used codes should not break the UX.
        }
      }).catch(() => {});
    }
    prevSignedInRef.current = isSignedIn;
  }, [isSignedIn, showToast]);

  return null;
}

function RootLayoutNav() {
  return (
    <SidebarProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0b' } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="venue/[id]" />
          <Stack.Screen name="report/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sign-up" options={{ presentation: 'modal' }} />
          <Stack.Screen name="about/index" />
          <Stack.Screen name="about/milestones" />
          <Stack.Screen name="about/team" />
          <Stack.Screen name="rewards" />
        </Stack>
        {/* Sidebar overlay — renders on top of everything via absolute positioning */}
        <Sidebar />
      </View>
    </SidebarProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Register background fetch once on mount — silently refreshes crowd scores
  // every ~15 min even when the app is backgrounded, so scores are fresh on open.
  useEffect(() => {
    registerBackgroundFetch();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <ClerkAuthBridge />
              <WatchlistBadgeProvider>
                <PushNotificationsProvider>
                  <GestureHandlerRootView>
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </PushNotificationsProvider>
              </WatchlistBadgeProvider>
            </ToastProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
