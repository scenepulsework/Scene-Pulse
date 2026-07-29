import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import {
  getGetVenueQueryKey,
  getListVenueReportsQueryKey,
  getListWatchlistQueryKey,
  useGetVenue,
  useListVenueReports,
  useListWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { CrowdDot } from '@/components/VenueCard';
import { VenueComments } from '@/components/VenueComments';
import { crowdColor, timeAgo, trendLabel } from '@/lib/venue-ui';
import { useUserLocation } from '@/hooks/useUserLocation';
import { haversineDistanceMi, formatDistanceMi } from '@/lib/haversine';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function VenueDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);

  const { data: venue, isLoading } = useGetVenue(id, {
    query: { enabled: !!id, queryKey: getGetVenueQueryKey(id) },
  });
  const { data: reports = [] } = useListVenueReports(id, {
    query: { enabled: !!id, queryKey: getListVenueReportsQueryKey(id) },
  });

  const { data: watchlist = [] } = useListWatchlist({
    query: {
      enabled: !!isSignedIn,
      queryKey: getListWatchlistQueryKey(),
    },
  });

  const isWatchlisted = watchlist.some((w) => w.id === id);

  const { mutate: addToWatchlist, isPending: addPending } = useAddToWatchlist({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
      },
    },
  });

  const { mutate: removeFromWatchlist, isPending: removePending } = useRemoveFromWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() });
      },
    },
  });

  const toggleWatchlist = () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (isWatchlisted) {
      removeFromWatchlist({ venueId: id });
    } else {
      addToWatchlist({ venueId: id });
    }
  };

  const { coords } = useUserLocation();

  const distanceMi =
    coords && venue
      ? haversineDistanceMi(coords.latitude, coords.longitude, venue.latitude, venue.longitude)
      : null;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  if (isLoading || !venue) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Feather name="alert-circle" size={24} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
              Venue not found
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                Back to feed
              </Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const levelColor = crowdColor(venue.crowdLevel);

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const storageBase = `https://${domain}/api/storage`;

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomInset + 100 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 8 }]}>
          <Pressable
            testID="back-button"
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
          <View style={styles.headerRight}>
            {venue.mapsUrl ? (
              <Pressable
                testID="open-maps"
                onPress={() => Linking.openURL(venue.mapsUrl!)}
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
                <Feather name="map-pin" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
            <Pressable
              testID="watchlist-toggle"
              onPress={toggleWatchlist}
              hitSlop={10}
              disabled={addPending || removePending}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: isWatchlisted ? `${colors.primary}22` : colors.card,
                  borderColor: isWatchlisted ? colors.primary : colors.border,
                  opacity: pressed || addPending || removePending ? 0.7 : 1,
                },
              ]}
            >
              <Feather
                name="bookmark"
                size={18}
                color={isWatchlisted ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.category, { color: colors.primary }]}>
            {venue.category.toUpperCase()} · {venue.market.toUpperCase()}
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{venue.name}</Text>
          <Text style={[styles.address, { color: colors.mutedForeground }]}>
            {venue.address}, {venue.city} · ★ {venue.rating.toFixed(1)}
          </Text>
          {distanceMi != null && (
            <View style={styles.distanceRow}>
              <Feather name="navigation" size={11} color={colors.primary} />
              <Text style={[styles.distanceText, { color: colors.primary }]}>
                {formatDistanceMi(distanceMi)} away
              </Text>
            </View>
          )}
        </View>

        {/* Photo gallery */}
        {venue.photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoGallery}
            style={{ marginBottom: 14 }}
          >
            {venue.photos.map((objectPath, i) => (
              <Pressable
                key={i}
                onPress={() => setLightboxIndex(i)}
                accessibilityRole="button"
                accessibilityLabel={`View ${venue.name} photo ${i + 1} full screen`}
              >
                <Image
                  source={{ uri: `${storageBase}${objectPath}` }}
                  style={[styles.photo, { borderRadius: colors.radius, borderColor: colors.border }]}
                  resizeMode="cover"
                  accessibilityLabel={`${venue.name} photo ${i + 1}`}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={venue.photos.map((p) => `${storageBase}${p}`)}
            initialIndex={lightboxIndex}
            venueName={venue.name}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {/* Live pulse panel */}
        <View
          style={[
            styles.panel,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View style={styles.panelHeader}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.panelTitle, { color: colors.mutedForeground }]}>LIVE PULSE</Text>
            <Text style={[styles.updated, { color: colors.mutedForeground }]}>
              {timeAgo(venue.updatedAt)}
            </Text>
          </View>
          <View style={styles.statGrid}>
            <View style={styles.bigStat}>
              <Text style={[styles.bigStatValue, { color: levelColor }]}>{venue.crowdScore}</Text>
              <View style={styles.levelRow}>
                <CrowdDot level={venue.crowdLevel} size={7} />
                <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
                  {venue.crowdLevel.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.bigStat}>
              <Text style={[styles.bigStatValue, { color: colors.foreground }]}>
                {venue.waitTimeMinutes}
                <Text style={[styles.unit, { color: colors.mutedForeground }]}> min</Text>
              </Text>
              <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>WAIT</Text>
            </View>
            <View style={styles.bigStat}>
              <Text style={[styles.bigStatValue, { color: colors.foreground }]}>
                {venue.headcount}
              </Text>
              <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>HEADCOUNT</Text>
            </View>
            <View style={styles.bigStat}>
              <Feather
                name={
                  venue.lineTrend === 'rising'
                    ? 'trending-up'
                    : venue.lineTrend === 'falling'
                      ? 'trending-down'
                      : 'minus'
                }
                size={24}
                color={
                  venue.lineTrend === 'rising'
                    ? colors.destructive
                    : venue.lineTrend === 'falling'
                      ? colors.success
                      : colors.mutedForeground
                }
              />
              <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
                LINE {trendLabel(venue.lineTrend).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.subStats, { borderTopColor: colors.border }]}>
            <SubStat icon="target" label="Seating" value={venue.seatingOdds} />
            <SubStat icon="volume-2" label="Noise" value={venue.noiseLevel} />
            <SubStat icon="dollar-sign" label="Cover" value={venue.coverCost} />
          </View>
        </View>

        {/* Timing */}
        <View
          style={[
            styles.panel,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View style={styles.panelHeader}>
            <Feather name="clock" size={14} color={colors.secondary} />
            <Text style={[styles.panelTitle, { color: colors.mutedForeground }]}>TIMING</Text>
          </View>
          <View style={styles.timingRow}>
            <Text style={[styles.timingLabel, { color: colors.mutedForeground }]}>Best window</Text>
            <Text style={[styles.timingValue, { color: colors.primary }]}>
              {venue.bestTimeWindow}
            </Text>
          </View>
          <View style={styles.timingRow}>
            <Text style={[styles.timingLabel, { color: colors.mutedForeground }]}>Peak pressure</Text>
            <Text style={[styles.timingValue, { color: colors.destructive }]}>
              {venue.peakPressureWindow}
            </Text>
          </View>
          <Text style={[styles.tipText, { color: colors.mutedForeground, marginTop: 8 }]}>
            {venue.reservationSignal}
          </Text>
        </View>

        {/* Opening hours */}
        {venue.openingHours && (
          <View
            style={[
              styles.panel,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.panelHeader}>
              <Feather name="clock" size={14} color={colors.accent} />
              <Text style={[styles.panelTitle, { color: colors.mutedForeground }]}>OPENING HOURS</Text>
            </View>
            {DAYS.map((day, i) => {
              const value = venue.openingHours![day];
              const isClosed = /closed/i.test(value ?? '');
              return (
                <View
                  key={day}
                  style={[
                    styles.hoursRow,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.hoursDay, { color: colors.mutedForeground }]}>
                    {day.slice(0, 3).toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.hoursValue,
                      { color: isClosed ? colors.mutedForeground : colors.foreground },
                    ]}
                  >
                    {value || '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Arrival tips */}
        {venue.arrivalTips.length > 0 && (
          <View
            style={[
              styles.panel,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.panelHeader}>
              <Feather name="compass" size={14} color={colors.accent} />
              <Text style={[styles.panelTitle, { color: colors.mutedForeground }]}>
                ARRIVAL TIPS
              </Text>
            </View>
            {venue.arrivalTips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.tipText, { color: colors.mutedForeground, flex: 1 }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Live reports */}
        <View
          style={[
            styles.panel,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View style={styles.panelHeader}>
            <Feather name="radio" size={14} color={colors.primary} />
            <Text style={[styles.panelTitle, { color: colors.mutedForeground }]}>
              LIVE REPORTS ({reports.length})
            </Text>
          </View>
          {reports.length === 0 ? (
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
              No reports yet tonight. Be the first to drop one.
            </Text>
          ) : (
            reports.map((r) => (
              <View
                key={r.id}
                style={[styles.reportRow, { borderTopColor: colors.border }]}
                testID={`report-${r.id}`}
              >
                <View style={styles.reportHeader}>
                  <CrowdDot level={r.crowdLevel} size={8} />
                  <Text style={[styles.reportName, { color: colors.foreground }]}>
                    {r.reporterName}
                  </Text>
                  <Text style={[styles.updated, { color: colors.mutedForeground }]}>
                    {timeAgo(r.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  {r.vibeNote} · {r.waitTimeMinutes}m wait · {r.crowdLevel}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Comments */}
        <VenueComments venueId={venue.id} />
      </ScrollView>

      {/* Floating report CTA */}
      <Pressable
        testID="drop-report"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/report/${venue.id}`);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.secondary,
            bottom: bottomInset + 20,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="zap" size={16} color={colors.secondaryForeground} />
        <Text style={[styles.fabText, { color: colors.secondaryForeground }]}>Drop a report</Text>
      </Pressable>
    </View>
  );
}

function PhotoLightbox({
  photos,
  initialIndex,
  venueName,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  venueName: string;
  onClose: () => void;
}) {
  const flatRef = useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={lightboxStyles.backdrop}>
        <FlatList
          ref={flatRef}
          data={photos}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(newIndex);
          }}
          renderItem={({ item, index }) => (
            <View style={lightboxStyles.slide}>
              <Image
                source={{ uri: item }}
                style={lightboxStyles.fullImage}
                resizeMode="contain"
                accessibilityLabel={`${venueName} photo ${index + 1}`}
              />
            </View>
          )}
        />

        {/* Counter */}
        {photos.length > 1 && (
          <View style={lightboxStyles.counter} pointerEvents="none">
            <Text style={lightboxStyles.counterText}>
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
        )}

        {/* Close button */}
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close photo viewer"
          style={({ pressed }) => [lightboxStyles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={lightboxStyles.closeIcon}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function SubStat({ icon, label, value }: { icon: any; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.subStat}>
      <Feather name={icon} size={13} color={colors.mutedForeground} />
      <View>
        <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
          {label.toUpperCase()}
        </Text>
        <Text style={[styles.subStatValue, { color: colors.foreground }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { paddingHorizontal: 16, marginBottom: 14 },
  category: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.4, marginBottom: 4 },
  name: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  address: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  distanceText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  panel: { borderWidth: 1, padding: 14, marginHorizontal: 16, marginBottom: 12 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  panelTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, flex: 1 },
  updated: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  bigStat: { width: '25%', alignItems: 'flex-start', gap: 4 },
  bigStatValue: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 28 },
  unit: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  subStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  subStat: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  subStatValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 1 },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timingLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  timingValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 6 },
  tipText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  reportRow: { paddingTop: 10, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  reportName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
  },
  fabText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  photoGallery: { paddingHorizontal: 16, gap: 8 },
  photo: { width: 220, height: 148, borderWidth: 1 },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  hoursDay: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, width: 36 },
  hoursValue: { fontSize: 13, fontFamily: 'Inter_400Regular', flexShrink: 1, textAlign: 'right' },
});

const lightboxStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  counter: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
