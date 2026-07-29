import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
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
import { PushNotificationsProvider } from '@/contexts/PushNotificationsContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/Sidebar';

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  useEffect(() => {
    setAuthTokenGetter(() => getTokenRef.current());
    return () => setAuthTokenGetter(null);
  }, []);
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

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ClerkAuthBridge />
            <PushNotificationsProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </PushNotificationsProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
