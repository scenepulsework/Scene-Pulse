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

const SORTS = [
  { key: 'crowdScore', label: 'Hottest' },
  { key: 'waitTime', label: 'Shortest wait' },
  { key: 'rating', label: 'Top rated' },
  { key: 'updated', label: 'Just updated' },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('crowdScore');

  const params = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(market ? { market } : {}),
      sort,
    }),
    [search, market, sort],
  );

  const { data: markets = [] } = useListMarkets({
    query: { queryKey: getListMarketsQueryKey() },
  });
  const { data: stats } = useGetHeroStats({
    query: { queryKey: getGetHeroStatsQueryKey() },
  });
  const {
    data: venues,
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

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FlatList
        data={venues ?? []}
        keyExtractor={(v) => String(v.id)}
        renderItem={({ item }) => <VenueCard venue={item} />}
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
              {SORTS.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  active={sort === s.key}
                  accent
                  onPress={() => setSort(s.key)}
                  testID={`sort-${s.key}`}
                />
              ))}
            </ScrollView>

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
});
