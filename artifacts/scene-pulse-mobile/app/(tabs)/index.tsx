import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  type Venue,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { VenueCard } from '@/components/VenueCard';
import { VenuePinsMap } from '@/components/VenuePinsMap';
import { useAuth, useUser } from '@clerk/expo';
import { useUserLocation } from '@/hooks/useUserLocation';
import { haversineDistanceMi } from '@/lib/haversine';
import { useSidebar } from '@/contexts/SidebarContext';
import { crowdColor } from '@/lib/venue-ui';

const PAGE_SIZE = 12;

const BASE_SORTS = [
  { key: 'crowdScore', label: 'Hottest' },
  { key: 'waitTime', label: 'Shortest wait' },
  { key: 'rating', label: 'Top rated' },
  { key: 'updated', label: 'Just updated' },
] as const;

const CATEGORIES = [
  { key: 'bar', label: 'Bars', icon: 'coffee' as const },
  { key: 'restaurant', label: 'Restaurants', icon: 'clipboard' as const },
  { key: 'cafe', label: 'Cafés', icon: 'sun' as const },
  { key: 'retail', label: 'Retail', icon: 'shopping-bag' as const },
  { key: 'experience', label: 'Experiences', icon: 'zap' as const },
];

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
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortKey>('crowdScore');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { coords, permissionGranted, canAskPermission, requestPermission } = useUserLocation();

  const effectiveSort = sort === 'nearest' && !permissionGranted ? 'crowdScore' : sort;
  const apiSort: BaseSort = effectiveSort === 'nearest' ? 'crowdScore' : effectiveSort;

  const params = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(market ? { market } : {}),
      ...(category ? { category } : {}),
      sort: apiSort,
    }),
    [search, market, category, apiSort],
  );

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, market, category, sort]);

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

  // All venues (unfiltered) for Browse by Type counts + Packed Now
  const { data: allRawVenues } = useListVenues(
    { sort: 'crowdScore' },
    { query: { queryKey: getListVenuesQueryKey({ sort: 'crowdScore' }) } },
  );

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

  // Hot scenes derived from all venues (hottest + best walk-in)
  const hotScenes = useMemo(() => {
    if (!allRawVenues?.length) return null;
    const hottest = allRawVenues[0]; // already sorted by crowdScore desc
    const easyWalkIn = [...allRawVenues]
      .filter((v) => v.crowdScore < 70)
      .sort((a, b) => {
        const wa = a.waitTime ?? 999;
        const wb = b.waitTime ?? 999;
        if (wa !== wb) return wa - wb;
        return b.rating - a.rating;
      })[0];
    return { hottest, easyWalkIn };
  }, [allRawVenues]);

  // Packed Now — high-energy venues
  const packedNow = useMemo(() => {
    if (!allRawVenues) return [];
    return allRawVenues.filter((v) => v.crowdScore >= 75).slice(0, 8);
  }, [allRawVenues]);

  // Category counts from all venues
  const categoryCounts = useMemo(() => {
    if (!allRawVenues) return {} as Record<string, number>;
    return allRawVenues.reduce<Record<string, number>>((acc, v) => {
      acc[v.category] = (acc[v.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [allRawVenues]);

  const paginatedVenues = useMemo(() => (venues ?? []).slice(0, visibleCount), [venues, visibleCount]);
  const remaining = (venues?.length ?? 0) - paginatedVenues.length;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const isFiltered = !!(search || market || category);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* ── STICKY HEADER (stays while scrolling) ────────────── */}
      <View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topInset + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
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
      </View>

      {/* ── SCROLLABLE FEED ───────────────────────────────────── */}
      <FlatList
        data={paginatedVenues}
        keyExtractor={(v) => String(v.id)}
        renderItem={({ item }) => <VenueCard venue={item} distanceMi={item._distanceMi} />}
        scrollEnabled={(paginatedVenues.length > 0) || isLoading}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        ListHeaderComponent={
          <ListHeader
            stats={stats}
            markets={markets}
            market={market}
            setMarket={setMarket}
            sort={sort}
            setSort={setSort}
            effectiveSort={effectiveSort}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            categoryCounts={categoryCounts}
            permissionGranted={permissionGranted}
            canAskPermission={canAskPermission}
            requestPermission={requestPermission}
            hotScenes={hotScenes}
            packedNow={packedNow}
            isFiltered={isFiltered}
            isLoading={isLoading}
            isError={isError}
            venueCount={venues?.length ?? 0}
            mapVenues={allRawVenues ?? []}
          />
        }
        ListFooterComponent={
          isLoading ? null : isError ? null : remaining > 0 ? (
            <Pressable
              testID="load-more-venues"
              onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
              style={({ pressed }) => [
                styles.loadMoreBtn,
                { borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
              <Text style={[styles.loadMoreText, { color: colors.mutedForeground }]}>
                Load {Math.min(remaining, PAGE_SIZE)} more{' '}
                <Text style={{ color: colors.mutedForeground, opacity: 0.6 }}>({remaining} left)</Text>
              </Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

// ─── Live Pulse Map section ───────────────────────────────────────────────────

function LivePulseMapSection({ venues }: { venues: Venue[] }) {
  const colors = useColors();
  const router = useRouter();
  const mapVenues = venues.filter(
    (v) => Number.isFinite(v.latitude) && Number.isFinite(v.longitude),
  );
  if (mapVenues.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle label="Live Pulse" icon="map" />
      <View
        style={[
          styles.mapPreviewContainer,
          {
            borderColor: colors.border,
            borderRadius: colors.radius,
            overflow: 'hidden',
          },
        ]}
      >
        <VenuePinsMap
          venues={mapVenues}
          selectedId={null}
          onSelect={(id) => {
            if (id != null) router.push(`/venue/${id}`);
          }}
          showsUserLocation={false}
        />
      </View>
      <Pressable
        onPress={() => router.push('/map')}
        style={({ pressed }) => [
          styles.mapCTABtn,
          {
            backgroundColor: `${colors.primary}0d`,
            borderColor: `${colors.primary}30`,
            borderRadius: colors.radius,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Feather name="map" size={13} color={colors.primary} />
        <Text style={[styles.mapCTAText, { color: colors.primary }]}>See full map</Text>
        <Feather name="arrow-right" size={13} color={colors.primary} />
      </Pressable>
    </View>
  );
}

// ─── ListHeader ──────────────────────────────────────────────────────────────

function ListHeader({
  stats, markets, market, setMarket, sort, setSort, effectiveSort, search, setSearch,
  category, setCategory, categoryCounts, permissionGranted, canAskPermission, requestPermission,
  hotScenes, packedNow, mapVenues, isFiltered, isLoading, isError, venueCount,
}: any) {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={{ paddingTop: 8 }}>

      {/* ── Live stats strip ──────────────────────────────────── */}
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
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Know before you go.</Text>
          </View>
        )}
      </View>

      {/* ── Search ───────────────────────────────────────────── */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
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

      {/* ── Market chips ─────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All" active={!market} onPress={() => setMarket(undefined)} testID="market-all" />
        {markets.map((m: any) => (
          <Chip
            key={m.market}
            label={`${m.market} (${m.venueCount})`}
            active={market === m.market}
            onPress={() => setMarket(market === m.market ? undefined : m.market)}
            testID={`market-${m.market}`}
          />
        ))}
      </ScrollView>

      {/* ── Sort chips ───────────────────────────────────────── */}
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

      {/* ── Location prompt ──────────────────────────────────── */}
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
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Nearest</Text> sort
          </Text>
          <Feather name="chevron-right" size={13} color={colors.primary} />
        </Pressable>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DISCOVER SECTIONS — shown when no active text/filter   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {!isFiltered && (
        <>
          {/* ── Hot Scenes ────────────────────────────────────── */}
          {hotScenes && (
            <View style={styles.section}>
              <SectionTitle label="Hot Scenes" icon="zap" />
              <View style={styles.hotScenesRow}>
                {hotScenes.hottest && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.hotCard,
                      { backgroundColor: colors.card, borderColor: `${colors.destructive}50`, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => router.push(`/venue/${hotScenes.hottest.id}`)}
                  >
                    <View style={styles.hotCardTag}>
                      <View style={[styles.hotDot, { backgroundColor: colors.destructive }]} />
                      <Text style={[styles.hotCardTagText, { color: colors.mutedForeground }]}>Hottest scene</Text>
                    </View>
                    <Text style={[styles.hotCardName, { color: colors.foreground }]} numberOfLines={2}>
                      {hotScenes.hottest.name}
                    </Text>
                    <Text style={[styles.hotCardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {hotScenes.hottest.city} · {hotScenes.hottest.category}
                    </Text>
                    <Text style={[styles.hotCardScore, { color: colors.destructive }]}>
                      {hotScenes.hottest.crowdScore}
                    </Text>
                  </Pressable>
                )}
                {hotScenes.easyWalkIn && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.hotCard,
                      { backgroundColor: colors.card, borderColor: `${colors.success}50`, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => router.push(`/venue/${hotScenes.easyWalkIn.id}`)}
                  >
                    <View style={styles.hotCardTag}>
                      <View style={[styles.hotDot, { backgroundColor: colors.success }]} />
                      <Text style={[styles.hotCardTagText, { color: colors.mutedForeground }]}>Best walk-in</Text>
                    </View>
                    <Text style={[styles.hotCardName, { color: colors.foreground }]} numberOfLines={2}>
                      {hotScenes.easyWalkIn.name}
                    </Text>
                    <Text style={[styles.hotCardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {hotScenes.easyWalkIn.city} · {hotScenes.easyWalkIn.category}
                    </Text>
                    <Text style={[styles.hotCardScore, { color: colors.success }]}>
                      {hotScenes.easyWalkIn.waitTime != null
                        ? `${hotScenes.easyWalkIn.waitTime}m wait`
                        : '—'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* ── Browse by type ────────────────────────────────── */}
          <View style={styles.section}>
            <SectionTitle label="Browse by Type" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeScrollContent}
            >
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.key] ?? 0;
                const isActive = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    testID={`category-${cat.key}`}
                    onPress={() => setCategory(isActive ? undefined : cat.key)}
                    style={({ pressed }) => [
                      styles.typeCard,
                      {
                        backgroundColor: isActive ? `${colors.primary}15` : colors.card,
                        borderColor: isActive ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Feather name={cat.icon} size={20} color={isActive ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.typeCardLabel, { color: isActive ? colors.primary : colors.foreground }]}>
                      {cat.label}
                    </Text>
                    {count > 0 && (
                      <Text style={[styles.typeCardCount, { color: colors.mutedForeground }]}>{count}</Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Packed Now ────────────────────────────────────── */}
          {packedNow.length > 0 && (
            <View style={styles.section}>
              <SectionTitle label="Packed Now" icon="activity" iconColor={colors.destructive} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.packedScrollContent}
              >
                {packedNow.map((v: any) => (
                  <Pressable
                    key={v.id}
                    style={({ pressed }) => [
                      styles.packedCard,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => router.push(`/venue/${v.id}`)}
                  >
                    <View style={styles.packedScoreRow}>
                      <Text style={[styles.packedScore, { color: crowdColor(v.crowdScore) }]}>
                        {v.crowdScore}
                      </Text>
                      <View style={[styles.packedDot, { backgroundColor: crowdColor(v.crowdScore) }]} />
                    </View>
                    <Text style={[styles.packedName, { color: colors.foreground }]} numberOfLines={2}>
                      {v.name}
                    </Text>
                    <Text style={[styles.packedMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {v.city}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Live Pulse Map ────────────────────────────────── */}
          <LivePulseMapSection venues={mapVenues} />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ALL VENUES section header                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      {!isLoading && !isError && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            {isFiltered
              ? `RESULTS${venueCount > 0 ? ` · ${venueCount}` : ''}`
              : market
              ? `${(market as string).toUpperCase()} VENUES`
              : 'ALL VENUES'}
          </Text>
          <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
        </View>
      )}

      {/* ── Loading / error / empty states ──────────────────── */}
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
        </View>
      )}
      {!isLoading && !isError && venueCount === 0 && (
        <View style={styles.stateWrap}>
          <Feather name="moon" size={22} color={colors.mutedForeground} />
          <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
            No venues match your pulse check.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ label, icon, iconColor }: { label: string; icon?: React.ComponentProps<typeof Feather>['name']; iconColor?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitleRow}>
      {icon && <Feather name={icon} size={13} color={iconColor ?? colors.primary} />}
      <Text style={[styles.sectionTitleText, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Sticky header
  stickyHeader: {
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    marginTop: 8,
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
  statLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
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

  // Location banner
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

  // Section wrapper
  section: { marginBottom: 20 },

  // Section title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },

  // Hot scenes
  hotScenesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  hotCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  hotCardTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  hotDot: { width: 6, height: 6, borderRadius: 3 },
  hotCardTagText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hotCardName: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 18 },
  hotCardMeta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  hotCardScore: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 4 },

  // Browse by type
  typeScrollContent: { gap: 10, paddingHorizontal: 16 },
  typeCard: {
    width: 90,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  typeCardLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  typeCardCount: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },

  // Packed Now
  packedScrollContent: { gap: 10, paddingHorizontal: 16 },
  packedCard: {
    width: 110,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  packedScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  packedScore: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  packedDot: { width: 7, height: 7, borderRadius: 4 },
  packedName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', lineHeight: 16 },
  packedMeta: { fontSize: 10, fontFamily: 'Inter_400Regular' },

  // All venues section divider
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 1, opacity: 0.5 },

  // States
  stateWrap: { alignItems: 'center', paddingVertical: 48, gap: 12, paddingHorizontal: 32 },
  stateText: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center', lineHeight: 19 },

  // Load more
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 12,
  },
  loadMoreText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  // Live Pulse Map section
  mapPreviewContainer: {
    height: 220,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  mapCTABtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    marginHorizontal: 16,
  },
  mapCTAText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
