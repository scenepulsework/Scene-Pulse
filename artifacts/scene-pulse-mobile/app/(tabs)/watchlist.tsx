import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  useGetMyActivity,
  getGetMyActivityQueryKey,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { crowdColor } from '@/lib/venue-ui';
import { CrowdDot } from '@/components/VenueCard';
import { usePushNotificationsContext } from '@/contexts/PushNotificationsContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useWatchlistBadge } from '@/contexts/WatchlistBadgeContext';

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { pushEnabled, togglePush } = usePushNotificationsContext();
  const { open: openSidebar } = useSidebar();
  const { clearBadge } = useWatchlistBadge();

  // Clear the packed badge as soon as the user lands on this tab
  useEffect(() => { clearBadge(); }, [clearBadge]);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: watchlist = [], isLoading } = useListWatchlist({
    query: { enabled: !!isSignedIn, queryKey: getListWatchlistQueryKey() },
  });

  const { data: activity, isLoading: isActivityLoading } = useGetMyActivity({
    query: { enabled: !!isSignedIn, queryKey: getGetMyActivityQueryKey() },
  });

  const { mutate: remove } = useRemoveFromWatchlist({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListWatchlistQueryKey() }),
    },
  });

  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Your Account';
  const hasRealName = !!(user?.fullName || user?.firstName);

  const startEditingName = () => { setNameInput(user?.fullName || user?.firstName || ''); setEditingName(true); };
  const cancelEditingName = () => { setEditingName(false); setNameInput(''); };

  const saveDisplayName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { Alert.alert('Name required', 'Please enter a display name.'); return; }
    setNameSaving(true);
    try {
      const parts = trimmed.split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || undefined;
      await user?.update({ firstName, lastName });
      setEditingName(false);
      setNameInput('');
    } catch { Alert.alert('Could not save', 'Please try again.'); }
    finally { setNameSaving(false); }
  };

  const StickyHeader = () => (
    <View style={[styles.stickyHeader, { paddingTop: topInset + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable
        onPress={openSidebar}
        hitSlop={10}
        style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
      >
        <Feather name="menu" size={18} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Saved Spots</Text>
      <View style={{ width: 38 }} />
    </View>
  );

  // ── Signed-out state ────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StickyHeader />
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

  // ── Signed-in state ─────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StickyHeader />
      <FlatList
        data={watchlist}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 8 }}>

            {/* Account info */}
            <View style={[styles.accountRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}22` }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                {editingName ? (
                  <View style={styles.nameEditRow}>
                    <TextInput
                      testID="display-name-input"
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Display name"
                      placeholderTextColor={colors.mutedForeground}
                      autoFocus
                      style={[styles.nameInput, { backgroundColor: colors.background, borderColor: colors.primary, color: colors.foreground, borderRadius: colors.radius }]}
                    />
                    <Pressable testID="save-display-name" onPress={() => void saveDisplayName()} disabled={nameSaving} hitSlop={8} style={({ pressed }) => ({ opacity: nameSaving || pressed ? 0.6 : 1, marginLeft: 6 })}>
                      {nameSaving ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="check" size={18} color={colors.primary} />}
                    </Pressable>
                    <Pressable testID="cancel-display-name" onPress={cancelEditingName} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginLeft: 6 })}>
                      <Feather name="x" size={18} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable testID="edit-display-name" onPress={startEditingName} style={styles.nameDisplayRow}>
                    {hasRealName ? (
                      <>
                        <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
                        <Feather name="edit-2" size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
                      </>
                    ) : (
                      <View style={[styles.addNamePrompt, { borderColor: colors.primary, borderRadius: colors.radius }]}>
                        <Feather name="user-plus" size={12} color={colors.primary} />
                        <Text style={[styles.addNameText, { color: colors.primary }]}>Add display name</Text>
                      </View>
                    )}
                  </Pressable>
                )}
                <Text style={[styles.accountEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
              <SignOutButton />
            </View>

            {/* Push notification toggle */}
            {Platform.OS !== 'web' && (
              <View style={[styles.prefRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Feather name="bell" size={16} color={colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prefLabel, { color: colors.foreground }]}>Push notifications</Text>
                  <Text style={[styles.prefSub, { color: colors.mutedForeground }]}>Alerts when a saved spot opens up</Text>
                </View>
                <Switch value={pushEnabled} onValueChange={() => void togglePush()} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.card} />
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {watchlist.length === 0 ? 'NO SAVED SPOTS' : `SAVED SPOTS (${watchlist.length})`}
            </Text>
            {isLoading && <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.centered}>
              <Feather name="bookmark" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved spots yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Bookmark a venue from its detail page to track it here.</Text>
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
              style={({ pressed }) => [styles.venueRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.venueHeader}>
                  <CrowdDot level={item.crowdLevel} size={7} />
                  <Text style={[styles.venueName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={[styles.venueMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.category} · {item.market} · Score {item.crowdScore}
                </Text>
              </View>
              <View style={styles.venueRight}>
                <Text style={[styles.crowdScore, { color: levelColor }]}>{item.crowdScore}</Text>
                <Pressable testID={`remove-watchlist-${item.id}`} onPress={() => remove({ venueId: item.id })} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                  <Feather name="bookmark" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <ActivitySection activity={activity} isLoading={isActivityLoading} onNavigate={(venueId) => router.push(`/venue/${venueId}`)} />
        }
      />
    </View>
  );
}

// ─── Activity Section ────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type ActivitySectionProps = {
  activity: { reports: { id: number; venueId: number; venueName: string; crowdLevel: string; createdAt: string }[]; comments: { id: number; venueId: number; venueName: string; message: string; createdAt: string }[] } | undefined;
  isLoading: boolean;
  onNavigate: (venueId: number) => void;
};

function ActivitySection({ activity, isLoading, onNavigate }: ActivitySectionProps) {
  const colors = useColors();
  const hasReports = (activity?.reports.length ?? 0) > 0;
  const hasComments = (activity?.comments.length ?? 0) > 0;
  const hasAny = hasReports || hasComments;

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MY ACTIVITY</Text>
      {isLoading && <View style={[styles.centered, { paddingVertical: 24 }]}><ActivityIndicator color={colors.primary} /></View>}
      {!isLoading && !hasAny && (
        <View style={[styles.activityEmpty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="clock" size={20} color={colors.mutedForeground} />
          <Text style={[styles.activityEmptyText, { color: colors.mutedForeground }]}>No reports or comments yet</Text>
        </View>
      )}
      {hasReports && (
        <>
          <Text style={[styles.activitySubLabel, { color: colors.mutedForeground }]}>REPORTS</Text>
          {activity!.reports.map((report) => (
            <Pressable key={`report-${report.id}`} testID={`activity-report-${report.id}`} onPress={() => onNavigate(report.venueId)}
              style={({ pressed }) => [styles.activityRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.activityIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Feather name="radio" size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityVenue, { color: colors.foreground }]} numberOfLines={1}>{report.venueName}</Text>
                <View style={styles.activityMeta}>
                  <CrowdDot level={report.crowdLevel} size={6} />
                  <Text style={[styles.activityMetaText, { color: colors.mutedForeground }]}>{report.crowdLevel} · {formatRelativeTime(report.createdAt)}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </>
      )}
      {hasComments && (
        <>
          <Text style={[styles.activitySubLabel, { color: colors.mutedForeground, marginTop: hasReports ? 12 : 0 }]}>COMMENTS</Text>
          {activity!.comments.map((comment) => (
            <Pressable key={`comment-${comment.id}`} testID={`activity-comment-${comment.id}`} onPress={() => onNavigate(comment.venueId)}
              style={({ pressed }) => [styles.activityRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.activityIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Feather name="message-circle" size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityVenue, { color: colors.foreground }]} numberOfLines={1}>{comment.venueName}</Text>
                <Text style={[styles.activityMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>{comment.message} · {formatRelativeTime(comment.createdAt)}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable testID="sign-out" onPress={() => signOut().then(() => router.replace('/'))} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Feather name="log-out" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  screenTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14, marginHorizontal: 16, marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  accountName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  accountEmail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  nameDisplayRow: { flexDirection: 'row', alignItems: 'center' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  nameInput: { flex: 1, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addNamePrompt: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  addNameText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 10 },
  centered: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  ctaBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  venueHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  venueName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  venueMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  venueRight: { alignItems: 'flex-end', gap: 8 },
  crowdScore: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 24 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14, marginHorizontal: 16, marginBottom: 16 },
  prefLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  prefSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  activitySubLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  activityIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityVenue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activityMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  activityEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  activityEmptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
