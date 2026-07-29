import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { Venue } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { crowdColor, trendLabel } from '@/lib/venue-ui';
import { formatDistanceMi } from '@/lib/haversine';

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

export function VenueCard({ venue, distanceMi }: { venue: Venue; distanceMi?: number }) {
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
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
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
        <View style={styles.scoreWrap}>
          <Text style={[styles.score, { color: levelColor }]}>{venue.crowdScore}</Text>
          <View style={styles.levelRow}>
            <CrowdDot level={venue.crowdLevel} size={7} />
            <Text style={[styles.level, { color: colors.mutedForeground }]}>
              {venue.crowdLevel.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statRow, { borderTopColor: colors.border }]}>
        <View style={styles.stat}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.statText, { color: colors.foreground }]}>
            {venue.waitTimeMinutes}m wait
          </Text>
        </View>
        <View style={styles.stat}>
          <Feather
            name={
              venue.lineTrend === 'rising'
                ? 'trending-up'
                : venue.lineTrend === 'falling'
                  ? 'trending-down'
                  : 'minus'
            }
            size={13}
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
        <View style={styles.stat}>
          <Feather name="star" size={13} color={colors.accent} />
          <Text style={[styles.statText, { color: colors.foreground }]}>
            {venue.rating.toFixed(1)}
          </Text>
        </View>
        {distanceMi != null && (
          <View style={styles.stat}>
            <Feather name="navigation" size={13} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {formatDistanceMi(distanceMi)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  category: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  dotSep: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.6 },
  market: { fontSize: 11, fontFamily: 'Inter_500Medium', flexShrink: 1 },
  name: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  scoreWrap: { alignItems: 'flex-end' },
  score: { fontSize: 28, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  level: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  statRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
