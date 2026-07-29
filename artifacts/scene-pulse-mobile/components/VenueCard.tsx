import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { Venue } from '@workspace/api-client-react';
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useListWatchlist,
  getListWatchlistQueryKey,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { crowdColor, trendLabel } from '@/lib/venue-ui';
import { formatDistanceMi } from '@/lib/haversine';
import { useAuth } from '@clerk/expo';

export function CrowdDot({ level, size = 10 }: { level: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: crowdColor(level),
      }}
    />
  );
}

function WatchlistButton({ venueId }: { venueId: number }) {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { data: watchlist = [] } = useListWatchlist({
    query: { enabled: !!isSignedIn, queryKey: getListWatchlistQueryKey() },
  });
  const isWatchlisted = watchlist.some((w) => w.id === venueId);

  const { mutate: add } = useAddToWatchlist({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() }),
    },
  });
  const { mutate: remove } = useRemoveFromWatchlist({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() }),
    },
  });

  if (!isSignedIn) return null;

  return (
    <Pressable
      hitSlop={10}
      onPress={(e) => {
        e.stopPropagation?.();
        Haptics.selectionAsync();
        if (isWatchlisted) {
          remove({ venueId });
        } else {
          add({ venueId });
        }
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 2 })}
    >
      <Feather
        name={isWatchlisted ? 'bookmark' : 'bookmark'}
        size={16}
        color={isWatchlisted ? colors.primary : colors.mutedForeground}
      />
    </Pressable>
  );
}

export function VenueCard({
  venue,
  distanceMi,
  compact,
}: {
  venue: Venue;
  distanceMi?: number;
  compact?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const levelColor = crowdColor(venue.crowdLevel);

  return (
    <Pressable
      testID={`venue-card-${venue.id}`}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/venue/${venue.id}`);
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* ── Crowd-level glow accent ────────────────────────────────── */}
      <View
        style={[
          styles.glowAccent,
          { backgroundColor: levelColor, opacity: venue.crowdLevel === 'packed' ? 0.08 : 0.04 },
        ]}
        pointerEvents="none"
      />

      {/* ── Top row: meta + name · score ───────────────────────────── */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: colors.primary }]}>
              {venue.category.toUpperCase()}
            </Text>
            <View style={[styles.dotSep, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.market, { color: colors.mutedForeground }]} numberOfLines={1}>
              {venue.market}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {venue.name}
          </Text>
        </View>

        <View style={styles.scoreBlock}>
          <View style={styles.scoreTopRow}>
            <Text style={[styles.score, { color: levelColor }]}>{venue.crowdScore}</Text>
            <WatchlistButton venueId={venue.id} />
          </View>
          <View style={styles.levelRow}>
            <CrowdDot level={venue.crowdLevel} size={7} />
            <Text style={[styles.level, { color: colors.mutedForeground }]}>
              {venue.crowdLevel.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <View style={[styles.statRow, { borderTopColor: colors.border }]}>
        {/* Wait time */}
        <View style={styles.stat}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={[styles.statText, { color: colors.foreground }]}>
            {venue.waitTimeMinutes != null ? `${venue.waitTimeMinutes}m` : '—'}
          </Text>
        </View>

        {/* Headcount */}
        {venue.headcount != null && (
          <View style={styles.stat}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.foreground }]}>
              {venue.headcount}
            </Text>
          </View>
        )}

        {/* Trend */}
        <View style={styles.stat}>
          <Feather
            name={
              venue.lineTrend === 'rising'
                ? 'trending-up'
                : venue.lineTrend === 'falling'
                  ? 'trending-down'
                  : 'minus'
            }
            size={12}
            color={
              venue.lineTrend === 'rising'
                ? colors.destructive
                : venue.lineTrend === 'falling'
                  ? colors.success
                  : colors.mutedForeground
            }
          />
          <Text style={[styles.statText, { color: colors.foreground }]}>
            {trendLabel(venue.lineTrend)}
          </Text>
        </View>

        {/* Noise */}
        {venue.noiseLevel && (
          <View style={styles.stat}>
            <Feather name="volume-2" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.foreground }]}>
              {venue.noiseLevel}
            </Text>
          </View>
        )}

        {/* Rating */}
        <View style={styles.stat}>
          <Feather name="star" size={12} color={colors.accent} />
          <Text style={[styles.statText, { color: colors.foreground }]}>
            {venue.rating.toFixed(1)}
          </Text>
        </View>

        {/* Distance */}
        {distanceMi != null && (
          <View style={styles.stat}>
            <Feather name="navigation" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {formatDistanceMi(distanceMi)}
            </Text>
          </View>
        )}
      </View>

      {/* ── Bottom: bestFor tags + best time + cover ───────────────── */}
      {!compact && (venue.bestFor?.length > 0 || venue.bestTimeWindow || venue.coverCost) && (
        <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
          {venue.bestFor?.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsContent}
            >
              {venue.bestFor.slice(0, 4).map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.bottomMeta}>
            {venue.bestTimeWindow ? (
              <View style={styles.stat}>
                <Feather name="clock" size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaSmall, { color: colors.mutedForeground }]}>
                  Best: {venue.bestTimeWindow}
                </Text>
              </View>
            ) : null}
            {venue.coverCost ? (
              <View style={styles.stat}>
                <Feather name="dollar-sign" size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaSmall, { color: colors.mutedForeground }]}>
                  {venue.coverCost}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  glowAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  // Top row
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  category: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  dotSep: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.6 },
  market: { fontSize: 11, fontFamily: 'Inter_500Medium', flexShrink: 1 },
  name: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },

  // Score block
  scoreBlock: { alignItems: 'flex-end', gap: 2 },
  scoreTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  score: { fontSize: 28, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  level: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },

  // Stats row
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  // Bottom row
  bottomRow: {
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  tagsContent: { gap: 6, paddingBottom: 2 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  bottomMeta: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  metaSmall: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
