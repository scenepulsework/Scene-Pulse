import React, { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';
import { useSidebar } from '@/contexts/SidebarContext';
import { useColors } from '@/hooks/useColors';
import { useGetHeroStats } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SIDEBAR_WIDTH = 300;
const SPRING = { damping: 24, stiffness: 220, mass: 0.8 };

type NavItem = {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: string;
  accent?: boolean;
  badge?: string;
};

// ─── Navigation groups ───────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Live Feed', icon: 'activity', route: '/' },
  { label: 'Pulse Map', icon: 'map', route: '/map', accent: true },
  { label: 'Saved Spots', icon: 'bookmark', route: '/watchlist' },
];

const EXPLORE_ITEMS: NavItem[] = [
  { label: 'Hottest Venues', icon: 'zap', route: '/', badge: 'Live' },
  { label: 'Browse Markets', icon: 'globe', route: '/map' },
  { label: 'Recent Reports', icon: 'file-text', route: '/' },
];

const COMMUNITY_ITEMS: NavItem[] = [
  { label: 'Rewards & Points', icon: 'award', route: '/rewards', accent: true },
  { label: 'Submit a Report', icon: 'edit-3', route: '/' },
  { label: 'Leaderboard', icon: 'bar-chart-2', route: '/' },
];

const INFO_ITEMS: NavItem[] = [
  { label: 'About ScenePulse', icon: 'info', route: '/about' },
  { label: 'Our Milestones', icon: 'flag', route: '/about/milestones' },
  { label: 'Meet the Team', icon: 'users', route: '/about/team' },
];

// ─── Sub-components (defined before Sidebar) ────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function NavGroup({
  label,
  items,
  onNavigate,
  colors,
}: {
  label: string;
  items: NavItem[];
  onNavigate: (route: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.navSection}>
      <Text style={[styles.navLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {items.map((item) => (
        <NavButton key={item.label} item={item} onPress={() => onNavigate(item.route)} colors={colors} />
      ))}
    </View>
  );
}

function NavButton({
  item,
  onPress,
  colors,
}: {
  item: NavItem;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navBtn,
        { backgroundColor: pressed ? `${colors.primary}10` : 'transparent' },
      ]}
    >
      <View
        style={[
          styles.navIconWrap,
          { backgroundColor: item.accent ? `${colors.primary}18` : `${colors.muted}60` },
        ]}
      >
        <Feather
          name={item.icon}
          size={16}
          color={item.accent ? colors.primary : colors.mutedForeground}
        />
      </View>
      <Text
        style={[
          styles.navBtnText,
          { color: item.accent ? colors.primary : colors.foreground },
        ]}
      >
        {item.label}
      </Text>
      <View style={styles.navBtnRight}>
        {item.badge && (
          <View style={[styles.navBadge, { backgroundColor: `${colors.success}20` }]}>
            <View style={[styles.navBadgeDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.navBadgeText, { color: colors.success }]}>{item.badge}</Text>
          </View>
        )}
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { isOpen, close } = useSidebar();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { data: stats } = useGetHeroStats();

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withSpring(0, SPRING);
      backdropOpacity.value = withTiming(1, { duration: 180 });
    } else {
      translateX.value = withSpring(-SIDEBAR_WIDTH, SPRING);
      backdropOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [isOpen]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const navigate = (route: string) => {
    close();
    setTimeout(() => router.push(route as any), 80);
  };

  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Account';

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          backdropStyle,
          { pointerEvents: isOpen ? 'auto' : 'none' },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          panelStyle,
          {
            backgroundColor: colors.card,
            borderRightColor: colors.border,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            width: SIDEBAR_WIDTH,
          },
        ]}
      >
        {/* Brand header */}
        <View style={styles.brandRow}>
          <Feather name="activity" size={20} color={colors.primary} />
          <Text style={[styles.brandText, { color: colors.foreground }]}>
            SCENE<Text style={{ color: colors.primary }}>PULSE</Text>
          </Text>
          <Pressable onPress={close} hitSlop={10} style={styles.closeBtn}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Stats strip */}
        {stats && (
          <View style={[styles.statsStrip, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <StatPill label="Venues" value={String(stats.totalVenues)} color={colors.primary} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatPill label="Markets" value={String(stats.marketsCovered)} color={colors.secondary} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatPill label="Packed" value={String(stats.packedNow)} color={colors.destructive} />
          </View>
        )}

        {/* Live pulse indicator */}
        <View style={styles.pulseRow}>
          <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.pulseText, { color: colors.mutedForeground }]}>
            {stats ? `${stats.liveReportsToday} live reports today` : 'Live now'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Scrollable nav groups */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.navScroll}
        >
          <NavGroup label="NAVIGATE" items={NAV_ITEMS} onNavigate={navigate} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: 0 }]} />
          <NavGroup label="EXPLORE" items={EXPLORE_ITEMS} onNavigate={navigate} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: 0 }]} />
          <NavGroup label="COMMUNITY" items={COMMUNITY_ITEMS} onNavigate={navigate} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: 0 }]} />
          <NavGroup label="INFO" items={INFO_ITEMS} onNavigate={navigate} colors={colors} />
        </ScrollView>

        {/* Account section */}
        <View style={[styles.accountSection, { borderColor: colors.border }]}>
          {isSignedIn ? (
            <>
              <View style={styles.accountRow}>
                <View style={[styles.avatar, { backgroundColor: `${colors.primary}22` }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {user?.primaryEmailAddress?.emailAddress}
                  </Text>
                </View>
              </View>
              <View style={styles.accountActions}>
                <Pressable
                  onPress={() => navigate('/rewards')}
                  style={({ pressed }) => [
                    styles.rewardsBtn,
                    { backgroundColor: `${colors.secondary}18`, borderColor: `${colors.secondary}30`, opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Feather name="award" size={13} color={colors.secondary} />
                  <Text style={[styles.rewardsBtnText, { color: colors.secondary }]}>Rewards</Text>
                </Pressable>
                <Pressable
                  onPress={() => signOut().then(() => { close(); router.replace('/'); })}
                  style={({ pressed }) => [
                    styles.signOutBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="log-out" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>Sign out</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              onPress={() => navigate('/sign-in')}
              style={({ pressed }) => [
                styles.signInBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="user" size={15} color={colors.primaryForeground} />
              <Text style={[styles.signInText, { color: colors.primaryForeground }]}>Sign in</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 998,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  brandText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    flex: 1,
  },
  closeBtn: { padding: 2 },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
  },
  statPill: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 20 },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5 },
  pulseText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16, marginVertical: 10 },

  // Nav scroll area
  navScroll: { paddingBottom: 8 },
  navSection: { paddingHorizontal: 12, paddingVertical: 4 },
  navLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    marginBottom: 4,
    marginTop: 4,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 1,
  },
  navIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  navBtnRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  navBadgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  navBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },

  // Account
  accountSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  accountName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  accountEmail: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  accountActions: { flexDirection: 'row', gap: 8 },
  rewardsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
  },
  rewardsBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  signOutText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 11,
  },
  signInText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
