import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { crowdColor } from '@/lib/venue-ui';
import type { VenuePinsMapHandle, VenuePinsMapProps } from './VenuePinsMap';

export type { VenuePinsMapHandle, VenuePinsMapProps } from './VenuePinsMap';

/**
 * Web fallback — react-native-maps 1.18.0 (the Expo Go compatible version)
 * cannot bundle for web. The web preview shows a tappable hot-spot list
 * instead; the real map renders on iOS/Android.
 */
export const VenuePinsMap = forwardRef<VenuePinsMapHandle, VenuePinsMapProps>(
  function VenuePinsMapWeb({ venues, selectedId, onSelect }, ref) {
    const colors = useColors();
    useImperativeHandle(ref, () => ({ animateTo: () => {}, fitToVenues: () => {} }));

    const sorted = useMemo(
      () => [...venues].sort((a, b) => b.crowdScore - a.crowdScore),
      [venues],
    );

    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.note}>
            <Feather name="smartphone" size={14} color={colors.mutedForeground} />
            <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
              The live map renders on your phone — open in Expo Go. Web preview shows hot spots
              as a list.
            </Text>
          </View>
          {sorted.map((venue) => (
            <Pressable
              key={venue.id}
              testID={`pin-${venue.id}`}
              onPress={() => onSelect(venue.id === selectedId ? null : venue.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: venue.id === selectedId ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[styles.dot, { backgroundColor: crowdColor(venue.crowdLevel) }]}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.name, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {venue.name}
                </Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {venue.city} · {venue.waitTimeMinutes}m wait
                </Text>
              </View>
              <Text style={[styles.score, { color: crowdColor(venue.crowdLevel) }]}>
                {venue.crowdScore}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  list: { paddingTop: 130, paddingHorizontal: 16, paddingBottom: 140, gap: 8 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10 },
  noteText: { flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  score: { fontSize: 18, fontFamily: 'Inter_700Bold' },
});
