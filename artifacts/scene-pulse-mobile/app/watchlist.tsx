import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/expo';
import {
  getListWatchlistQueryKey,
  useListWatchlist,
  useRemoveFromWatchlist,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { crowdColor } from '@/lib/venue-ui';
import { CrowdDot } from '@/components/VenueCard';

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const { data: watchlist = [], isLoading } = useListWatchlist({
    query: {
      enabled: !!isSignedIn,
      queryKey: getListWatchlistQueryKey(),
    },
  });

  const { mutate: remove } = useRemoveFromWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
      },
    },
  });

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Your Account';

  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Watchlist</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centered}>
          <Feather name="bookmark" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to see your watchlist</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Save venues and get alerts when they open up.
          </Text>
          <Pressable
            onPress={() => router.push('/sign-in')}
            style={({ pressed }) => [styles.ctaBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.ctaBtnText, { color: colors.primaryForeground }]}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={watchlist}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        ListHeaderComponent={
          <View style={{ paddingTop: topInset + 8 }}>
            <View style={[styles.header]}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={10}
                style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.screenTitle, { color: colors.foreground }]}>Watchlist</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Account info */}
            <View style={[styles.accountRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}22` }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={[styles.accountEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
              <SignOutButton />
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {watchlist.length === 0 ? 'NO SAVED SPOTS' : `SAVED SPOTS (${watchlist.length})`}
            </Text>

            {isLoading && (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.centered}>
              <Feather name="bookmark" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved spots yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Bookmark a venue from its detail page to track it here.
              </Text>
              <Pressable
                onPress={() => router.replace('/')}
                style={({ pressed }) => [styles.ctaBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={[styles.ctaBtnText, { color: colors.foreground }]}>Browse venues</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const levelColor = crowdColor(item.crowdLevel);
          return (
            <Pressable
              testID={`watchlist-venue-${item.id}`}
              onPress={() => router.push(`/venue/${item.id}`)}
              style={({ pressed }) => [
                styles.venueRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.venueHeader}>
                  <CrowdDot level={item.crowdLevel} size={7} />
                  <Text style={[styles.venueName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[styles.venueMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.category} · {item.market} · Score {item.crowdScore}
                </Text>
              </View>
              <View style={styles.venueRight}>
                <Text style={[styles.crowdScore, { color: levelColor }]}>{item.crowdScore}</Text>
                <Pressable
                  testID={`remove-watchlist-${item.id}`}
                  onPress={() => remove({ venueId: item.id })}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Feather name="bookmark" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable
      testID="sign-out"
      onPress={() => signOut().then(() => router.replace('/'))}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Feather name="log-out" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  screenTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  accountName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  accountEmail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  centered: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  ctaBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  ctaBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  venueHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  venueName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  venueMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  venueRight: { alignItems: 'flex-end', gap: 8 },
  crowdScore: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 24 },
});
