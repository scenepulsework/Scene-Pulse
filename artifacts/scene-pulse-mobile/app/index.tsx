import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  getGetHeroStatsQueryKey,
  getListMarketsQueryKey,
  getListVenuesQueryKey,
  useGetHeroStats,
  useListMarkets,
  useListVenues,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { VenueCard } from '@/components/VenueCard';
import { useAuth, useUser } from '@clerk/expo';
import { useUserLocation } from '@/hooks/useUserLocation';
import { haversineDistanceMi } from '@/lib/haversine';

const BASE_SORTS = [
  { key: 'crowdScore', label: 'Hottest' },
  { key: 'waitTime', label: 'Shortest wait' },
  { key: 'rating', label: 'Top rated' },
  { key: 'updated', label: 'Just updated' },
] as const;

type BaseSort = (typeof BASE_SORTS)[number]['key'];
type SortKey = BaseSort | 'nearest';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortKey>('crowdScore');

  const { coords, permissionGranted, canAskPermission, requestPermission } = useUserLocation();

  // When permission is revoked while "nearest" is active, fall back to hottest.
  const effectiveSort = sort === 'nearest' && !permissionGranted ? 'crowdScore' : sort;

  // Sorts that go to the API (nearest is client-side only)
  const apiSort: BaseSort = effectiveSort === 'nearest' ? 'crowdScore' : effectiveSort;

  const params = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(market ? { market } : {}),
      sort: apiSort,
    }),
    [search, market, apiSort],
  );

  const { data: markets = [] } = useListMarkets({
    query: { queryKey: getListMarketsQueryKey() },
  });
  const { data: stats } = useGetHeroStats({
    query: { queryKey: getGetHeroStatsQueryKey() },
  });
  const {
    data: rawVenues,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useListVenues(params, {
    query: {
      queryKey: getListVenuesQueryKey(params),
      placeholderData: (prev) => prev,
    },
  });

  // Attach client-side distances and optionally sort by nearest.
  const venues = useMemo(() => {
    if (!rawVenues) return rawVenues;
    const withDist = rawVenues.map((v) => ({
      ...v,
      _distanceMi:
        coords &&
        Number.isFinite(v.latitude) &&
        Number.isFinite(v.longitude)
          ? haversineDistanceMi(coords.latitude, coords.longitude, v.latitude, v.longitude)
          : undefined,
    }));
    if (effectiveSort === 'nearest') {
      return [...withDist].sort((a, b) => {
        if (a._distanceMi == null && b._distanceMi == null) return 0;
        if (a._distanceMi == null) return 1;
        if (b._distanceMi == null) return -1;
        return a._distanceMi - b._distanceMi;
      });
    }
    return withDist;
  }, [rawVenues, coords, effectiveSort]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FlatList
        data={venues ?? []}
        keyExtractor={(v) => String(v.id)}
        renderItem={({ item }) => <VenueCard venue={item} distanceMi={item._distanceMi} />}
        scrollEnabled={(venues?.length ?? 0) > 0 || isLoading}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        ListHeaderComponent={
          <View style={{ paddingTop: topInset + 12 }}>
            {/* Brand header */}
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <Feather name="activity" size={22} color={colors.primary} />
                <Text style={[styles.brand, { color: colors.foreground }]}>
                  SCENE<Text style={{ color: colors.primary }}>PULSE</Text>
                </Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  testID="open-map"
                  onPress={() => router.push('/map')}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.mapBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Feather name="map" size={18} color={colors.primary} />
                </Pressable>
                {isSignedIn ? (
                  <Pressable
                    testID="open-watchlist"
                    onPress={() => router.push('/watchlist')}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.mapBtn,
                      {
                        backgroundColor: `${colors.primary}22`,
                        borderColor: colors.primary,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View style={styles.avatarBtn}>
                      <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                        {(user?.fullName || user?.firstName || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    testID="open-signin"
                    onPress={() => router.push('/sign-in')}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.mapBtn,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Feather name="user" size={18} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
              {stats ? (
                <Text style={[styles.subline, { color: colors.mutedForeground }]}>
                  {stats.liveReportsToday} live reports today · {stats.packedNow} packed ·{' '}
                  {stats.openNow} open now
                </Text>
              ) : (
                <Text style={[styles.subline, { color: colors.mutedForeground }]}>
                  Know before you go.
                </Text>
              )}
            </View>

            {/* Search */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                testID="search-input"
                value={search}
                onChangeText={setSearch}
                placeholder="Search venues, vibes, neighborhoods"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8} testID="clear-search">
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            {/* Market chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Chip
                label="All markets"
                active={!market}
                onPress={() => setMarket(undefined)}
                testID="market-all"
              />
              {markets.map((m) => (
                <Chip
                  key={m.market}
                  label={`${m.market} (${m.venueCount})`}
                  active={market === m.market}
                  onPress={() => setMarket(market === m.market ? undefined : m.market)}
                  testID={`market-${m.market}`}
                />
              ))}
            </ScrollView>

            {/* Sort chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.chipRow, { paddingTop: 0 }]}
            >
              {BASE_SORTS.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  active={effectiveSort === s.key}
                  accent
                  onPress={() => setSort(s.key)}
                  testID={`sort-${s.key}`}
                />
              ))}
              {permissionGranted && (
                <Chip
                  key="nearest"
                  label="Nearest"
                  active={effectiveSort === 'nearest'}
                  accent
                  onPress={() => setSort('nearest')}
                  testID="sort-nearest"
                />
              )}
            </ScrollView>

            {/* Location prompt banner — shown when permission not yet granted */}
            {!permissionGranted && canAskPermission && (
              <Pressable
                testID="location-prompt"
                onPress={requestPermission}
                style={({ pressed }) => [
                  styles.locationBanner,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name="navigation" size={14} color={colors.primary} />
                <Text style={[styles.locationBannerText, { color: colors.mutedForeground }]}>
                  Enable location to sort by{' '}
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                    Nearest
                  </Text>
                </Text>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}

            {isLoading && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Scanning venues…
                </Text>
              </View>
            )}
            {isError && !isLoading && (
              <View style={styles.loadingWrap}>
                <Feather name="wifi-off" size={22} color={colors.mutedForeground} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Couldn't reach the pulse feed.
                </Text>
                <Pressable
                  testID="retry-button"
                  onPress={() => refetch()}
                  style={[
                    styles.retryBtn,
                    { borderColor: colors.primary, borderRadius: colors.radius },
                  ]}
                >
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            )}
            {!isLoading && !isError && (venues?.length ?? 0) === 0 && (
              <View style={styles.loadingWrap}>
                <Feather name="moon" size={22} color={colors.mutedForeground} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  No venues matching your pulse check.
                </Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  accent,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  const activeColor = accent ? colors.secondary : colors.primary;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? activeColor : colors.card,
          borderColor: active ? activeColor : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold',
          color: active ? colors.background : colors.mutedForeground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, marginBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  subline: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', height: '100%' },
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  retryBtn: { borderWidth: 1, paddingHorizontal: 18, paddingVertical: 8 },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 17 },
});
