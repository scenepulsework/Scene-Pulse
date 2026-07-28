import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  getListVenuesQueryKey,
  useListVenues,
  type Venue,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { crowdColor } from '@/lib/venue-ui';
import { VenuePinsMap, type VenuePinsMapHandle } from '@/components/VenuePinsMap';

function regionForVenues(venues: Venue[]) {
  const lats = venues.map((v) => v.latitude);
  const lngs = venues.map((v) => v.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.05),
  };
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<VenuePinsMapHandle>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [showsUserLocation, setShowsUserLocation] = useState(false);

  const { data: venues = [], isLoading } = useListVenues(
    {},
    { query: { queryKey: getListVenuesQueryKey({}) } },
  );

  const mappable = useMemo(
    () => venues.filter((v) => Number.isFinite(v.latitude) && Number.isFinite(v.longitude)),
    [venues],
  );
  const selected = mappable.find((v) => v.id === selectedId) ?? null;
  const initialRegion = useMemo(
    () => (mappable.length ? regionForVenues(mappable) : undefined),
    // Compute once from the first non-empty load; the map keeps its own camera after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mappable.length > 0],
  );

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const centerOnMe = async () => {
    if (Platform.OS === 'web') return;
    try {
      setLocating(true);
      let granted = permission?.granted ?? false;
      if (!granted) {
        const res = await requestPermission();
        granted = res.granted;
      }
      if (!granted) return;
      setShowsUserLocation(true);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateTo(pos.coords.latitude, pos.coords.longitude);
    } catch {
      // Location unavailable — keep the current camera.
    } finally {
      setLocating(false);
    }
  };

  const permissionBlocked =
    permission != null && !permission.granted && !permission.canAskAgain;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
            Loading the pulse map…
          </Text>
        </View>
      ) : mappable.length === 0 ? (
        <View style={styles.center}>
          <Feather name="map" size={24} color={colors.mutedForeground} />
          <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
            No venues to map right now.
          </Text>
        </View>
      ) : (
        <VenuePinsMap
          ref={mapRef}
          venues={mappable}
          selectedId={selectedId}
          onSelect={setSelectedId}
          showsUserLocation={showsUserLocation}
          initialRegion={initialRegion}
        />
      )}

      {/* Header */}
      <View style={[styles.header, { top: topInset + 8 }]}>
        <Pressable
          testID="map-back"
          onPress={() => router.back()}
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
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </Pressable>
        <View
          style={[
            styles.legend,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <LegendDot color={crowdColor('open')} label="Open" />
          <LegendDot color={crowdColor('lively')} label="Lively" />
          <LegendDot color={crowdColor('packed')} label="Packed" />
        </View>
        {Platform.OS !== 'web' ? (
          <Pressable
            testID="locate-me"
            onPress={centerOnMe}
            disabled={locating || permissionBlocked}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed || permissionBlocked ? 0.5 : 1,
              },
            ]}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather
                name="crosshair"
                size={18}
                color={permissionBlocked ? colors.mutedForeground : colors.primary}
              />
            )}
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {permissionBlocked && Platform.OS !== 'web' && (
        <View style={[styles.permissionNote, { top: topInset + 58 }]}>
          <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>
            Location is off — enable it in Settings to center on you.
          </Text>
        </View>
      )}

      {/* Selected venue card */}
      {selected && (
        <Pressable
          testID={`map-card-${selected.id}`}
          onPress={() => router.push(`/venue/${selected.id}`)}
          style={({ pressed }) => [
            styles.card,
            {
              bottom: bottomInset + 16,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.cardCategory, { color: colors.primary }]}>
              {selected.category.toUpperCase()} · {selected.city.toUpperCase()}
            </Text>
            <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
              {selected.name}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
              {selected.waitTimeMinutes}m wait ·{' '}
              <Text style={{ color: crowdColor(selected.crowdLevel) }}>
                {selected.crowdLevel.toUpperCase()}
              </Text>
            </Text>
          </View>
          <View style={styles.cardScore}>
            <Text style={[styles.scoreValue, { color: crowdColor(selected.crowdLevel) }]}>
              {selected.crowdScore}
            </Text>
            <Feather name="arrow-up-right" size={16} color={colors.primary} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mutedText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 32,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permissionNote: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  permissionText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardCategory: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardName: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  cardMeta: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },
  cardScore: { alignItems: 'center', gap: 2 },
  scoreValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
});
