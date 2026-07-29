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
import { useSidebar } from '@/contexts/SidebarContext';

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
  const { open: openSidebar } = useSidebar();
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortKey>('crowdScore');

  const { coords, permissionGranted, canAskPermission, requestPermission } = useUserLocation();

  const effectiveSort = sort === 'nearest' && !permissionGranted ? 'crowdScore' : sort;
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
      placeholderData: (prev: any) => prev,
    },
  });

  const venues = useMemo(() => {
    if (!rawVenues) return rawVenues;
    const withDist = rawVenues.map((v) => ({
      ...v,
      _distanceMi:
        coords && Number.isFinite(v.latitude) && Number.isFinite(v.longitude)
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
          <View style={{ paddingTop: topInset + 8 }}>

            {/* ── Top header bar ─────────────────────────────── */}
            <View style={styles.headerBar}>
              <Pressable
                testID="open-sidebar"
                onPress={openSidebar}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.iconBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="menu" size={18} color={colors.foreground} />
              </Pressable>

              <View style={styles.brandCenter}>
                <Feather name="activity" size={16} color={colors.primary} />
                <Text style={[styles.brand, { color: colors.foreground }]}>
                  SCENE<Text style={{ color: colors.primary }}>PULSE</Text>
                </Text>
              </View>

              {isSignedIn ? (
                <Pressable
                  testID="open-watchlist"
                  onPress={() => router.push('/watchlist')}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    {
                      backgroundColor: `${colors.primary}1a`,
                      borderColor: colors.primary,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                    {(user?.fullName || user?.firstName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  testID="open-signin"
                  onPress={() => router.push('/sign-in')}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Feather name="user" size={17} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            {/* ── Live stats strip ───────────────────────────── */}
            <View style={[styles.statsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {stats ? (
                <View style={styles.statsInner}>
                  <StatItem value={stats.totalVenues} label="venues" color={colors.primary} />
                  <View style={[styles.statSep, { backgroundColor: colors.border }]} />
                  <StatItem value={stats.marketsCovered} label="markets" color={colors.secondary} />
                  <View style={[styles.statSep, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.statValue, { color: colors.success }]}>{stats.liveReportsToday}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>live</Text>
                  </View>
                  <View style={[styles.statSep, { backgroundColor: colors.border }]} />
                  <StatItem value={stats.packedNow} label="packed" color={colors.destructive} />
                </View>
              ) : (
                <View style={styles.statsInner}>
                  <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
                    Know before you go.
                  </Text>
                </View>
              )}
            </View>

            {/* ── Search ─────────────────────────────────────── */}
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
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                testID="search-input"
                value={search}
                onChangeText={setSearch}
                placeholder="Search venues, vibes, neighborhoods…"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8} testID="clear-search">
                  <Feather name="x" size={15} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            {/* ── Market chips ───────────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <Chip label="All" active={!market} onPress={() => setMarket(undefined)} testID="market-all" />
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

            {/* ── Sort chips ─────────────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.chipRow, { paddingTop: 0, paddingBottom: 14 }]}
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

            {/* ── Location prompt ────────────────────────────── */}
            {!permissionGranted && canAskPermission && (
              <Pressable
                testID="location-prompt"
                onPress={requestPermission}
                style={({ pressed }) => [
                  styles.locationBanner,
                  {
                    backgroundColor: `${colors.primary}0d`,
                    borderColor: `${colors.primary}40`,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name="navigation" size={13} color={colors.primary} />
                <Text style={[styles.locationBannerText, { color: colors.mutedForeground }]}>
                  Enable location for{' '}
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                    Nearest
                  </Text>{' '}
                  sort
                </Text>
                <Feather name="chevron-right" size={13} color={colors.primary} />
              </Pressable>
            )}

            {/* ── Section label ──────────────────────────────── */}
            {!isLoading && !isError && (venues?.length ?? 0) > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  {market ? `${market.toUpperCase()} VENUES` : 'ALL VENUES'}
                </Text>
                <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
              </View>
            )}

            {/* ── States ─────────────────────────────────────── */}
            {isLoading && (
              <View style={styles.stateWrap}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.stateText, { color: colors.mutedForeground }]}>Scanning venues…</Text>
              </View>
            )}
            {isError && !isLoading && (
              <View style={styles.stateWrap}>
                <Feather name="wifi-off" size={22} color={colors.mutedForeground} />
                <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
                  Couldn't reach the pulse feed.
                </Text>
                <Pressable
                  testID="retry-button"
                  onPress={() => refetch()}
                  style={[styles.retryBtn, { borderColor: colors.primary, borderRadius: colors.radius }]}
                >
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            )}
            {!isLoading && !isError && (venues?.length ?? 0) === 0 && (
              <View style={styles.stateWrap}>
                <Feather name="moon" size={22} color={colors.mutedForeground} />
                <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
                  No venues match your pulse check.
                </Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function Chip({
  label, active, onPress, accent, testID,
}: {
  label: string; active: boolean; onPress: () => void; accent?: boolean; testID?: string;
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
      <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: active ? colors.background : colors.mutedForeground }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  brand: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  avatarInitial: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 16 },

  // Stats strip
  statsStrip: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 4,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 20 },
  statLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 1 },
  statSep: { width: 1, height: 28, opacity: 0.6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  tagline: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    height: 44,
    marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', height: '100%' },

  // Chips
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },

  // Location
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  locationBannerText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },

  // Section label
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 1, opacity: 0.5 },

  // States
  stateWrap: { alignItems: 'center', paddingVertical: 48, gap: 12, paddingHorizontal: 32 },
  stateText: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center', lineHeight: 19 },
  retryBtn: { borderWidth: 1, paddingHorizontal: 20, paddingVertical: 9 },
});
