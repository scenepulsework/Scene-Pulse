import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import {
  useGetMyRewards,
  useGetMyReferralCode,
  useRedeemReferral,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS: Record<string, number> = {
  Scout: 0,
  Regular: 100,
  Insider: 500,
  'Pulse Pioneer': 1500,
};

const LEVEL_ACCENT: Record<string, string> = {
  Scout: '#94a3b8',
  Regular: '#60a5fa',
  Insider: '#a855f7',
  'Pulse Pioneer': '#f59e0b',
};

const EARN_WAYS: Array<{
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  pts: string;
  desc: string;
}> = [
  { icon: 'activity', label: 'Submit a live report', pts: '+10 pts', desc: "Tell others what's happening at a venue right now" },
  { icon: 'message-square', label: 'Leave a comment', pts: '+5 pts', desc: 'Share your experience and keep the feed fresh' },
  { icon: 'bookmark', label: 'Save a venue', pts: '+5 pts', desc: 'Add a spot to your watchlist' },
  { icon: 'users', label: 'Refer a friend', pts: '+100 pts', desc: 'Earn 100 points when they sign up with your code' },
  { icon: 'gift', label: 'Use a referral code', pts: '+25 pts', desc: 'One-time welcome bonus when you join via a referral' },
];

const REASON_LABEL: Record<string, string> = {
  report: 'Submitted a live report',
  comment: 'Left a comment',
  watchlist: 'Saved a venue',
  referral_gave: 'Friend joined with your code',
  referral_received: 'Joined with a referral code',
};

// ─── Sub-components (defined before parent) ──────────────────────────────────

function PageHeader({ title }: { title: string }) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{text}</Text>
  );
}

function SkeletonBlock({ height = 120 }: { height?: number }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.skeleton,
        { height, backgroundColor: colors.card, borderColor: colors.border },
      ]}
    />
  );
}

function LevelCard({
  points,
  level,
  nextLevel,
  pointsToNextLevel,
}: {
  points: number;
  level: string;
  nextLevel: string | null;
  pointsToNextLevel: number | null;
}) {
  const colors = useColors();
  const accent = LEVEL_ACCENT[level] ?? colors.primary;
  const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const nextThreshold = nextLevel ? (LEVEL_THRESHOLDS[nextLevel] ?? 1500) : null;
  const progressPct = nextThreshold
    ? Math.min(100, ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <View
      style={[
        styles.levelCard,
        {
          backgroundColor: colors.card,
          borderColor: `${accent}40`,
        },
      ]}
    >
      {/* Level badge top-left, points top-right */}
      <View style={styles.levelCardTop}>
        <View>
          <Text style={[styles.levelMeta, { color: colors.mutedForeground }]}>CURRENT LEVEL</Text>
          <Text style={[styles.levelName, { color: accent }]}>{level}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.levelMeta, { color: colors.mutedForeground }]}>TOTAL POINTS</Text>
          <Text style={[styles.levelPoints, { color: colors.foreground }]}>
            {points.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      {nextLevel && pointsToNextLevel != null ? (
        <>
          <View style={[styles.progressTrack, { backgroundColor: `${colors.background}80` }]}>
            <View
              testID="progress-fill"
              style={[
                styles.progressFill,
                { width: `${progressPct}%` as any, backgroundColor: accent },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{level}</Text>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {pointsToNextLevel.toLocaleString()} pts to{' '}
              <Text style={{ color: LEVEL_ACCENT[nextLevel] ?? colors.foreground }}>{nextLevel}</Text>
            </Text>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{nextLevel}</Text>
          </View>
        </>
      ) : (
        <View style={styles.maxLevelRow}>
          <Feather name="star" size={12} color="#f59e0b" />
          <Text style={styles.maxLevelText}>Max level — you're a Pulse Pioneer</Text>
        </View>
      )}
    </View>
  );
}

function ReferralCard({
  code,
  usesCount,
}: {
  code: string;
  usesCount: number;
}) {
  const colors = useColors();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join ScenePulse — the real-time crowd intel app. Use my referral code ${code} when you sign up and get 25 free points! 🎉`,
        title: 'ScenePulse Referral Code',
      });
    } catch {
      // dismissed
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: `${colors.primary}18` }]}>
          <Feather name="users" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Refer friends</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            +100 pts per referral • they get +25 pts
          </Text>
        </View>
      </View>

      {/* Code display */}
      <View style={[styles.codeRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.codeText, { color: colors.foreground }]}>{code}</Text>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.shareBtn,
            { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30`, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="share-2" size={14} color={colors.primary} />
          <Text style={[styles.shareBtnText, { color: colors.primary }]}>Share</Text>
        </Pressable>
      </View>

      {usesCount > 0 && (
        <View style={styles.usesRow}>
          <Feather name="users" size={11} color={colors.mutedForeground} />
          <Text style={[styles.usesText, { color: colors.mutedForeground }]}>
            Used by {usesCount} friend{usesCount !== 1 ? 's' : ''} so far
          </Text>
        </View>
      )}
    </View>
  );
}

function RedeemCard() {
  const colors = useColors();
  const { mutate: redeemReferral, isPending } = useRedeemReferral();
  const [code, setCode] = useState('');

  const handleRedeem = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    redeemReferral(
      { data: { code: trimmed } },
      {
        onSuccess: (result) => {
          Alert.alert('🎉 Code redeemed!', `+${result.pointsEarned} points added to your account.`);
          setCode('');
        },
        onError: () => {
          Alert.alert('Invalid code', "That code couldn't be redeemed. It may be expired or already used.");
        },
      },
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 4 }]}>Have a referral code?</Text>
      <Text style={[styles.cardSub, { color: colors.mutedForeground, marginBottom: 12 }]}>
        Enter it below to claim your welcome bonus.
      </Text>
      <View style={styles.redeemRow}>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="ENTER CODE"
          placeholderTextColor={colors.mutedForeground}
          maxLength={8}
          autoCapitalize="characters"
          style={[
            styles.codeInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />
        <Pressable
          onPress={handleRedeem}
          disabled={isPending || !code.trim()}
          style={({ pressed }) => [
            styles.redeemBtn,
            {
              backgroundColor: colors.primary,
              opacity: (isPending || !code.trim()) ? 0.5 : pressed ? 0.8 : 1,
            },
          ]}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.redeemBtnText}>Redeem</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function EarnRow({
  icon,
  label,
  pts,
  desc,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  pts: string;
  desc: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.earnRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.earnIconWrap, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}20` }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.earnText}>
        <Text style={[styles.earnLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.earnDesc, { color: colors.mutedForeground }]}>{desc}</Text>
      </View>
      <Text style={[styles.earnPts, { color: colors.primary }]}>{pts}</Text>
    </View>
  );
}

function TransactionRow({
  points,
  reason,
  createdAt,
}: {
  points: number;
  reason: string;
  createdAt: string;
}) {
  const colors = useColors();
  const isPositive = points > 0;
  const dateStr = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text
        style={[
          styles.txPoints,
          { color: isPositive ? colors.primary : colors.destructive ?? '#ef4444' },
        ]}
      >
        {isPositive ? '+' : ''}{points}
      </Text>
      <Text style={[styles.txReason, { color: colors.foreground }]} numberOfLines={1}>
        {REASON_LABEL[reason] ?? reason}
      </Text>
      <View style={styles.txDateRow}>
        <Feather name="clock" size={10} color={colors.mutedForeground} />
        <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{dateStr}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function RewardsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const { data: rewards, isLoading: rewardsLoading } = useGetMyRewards({
    query: { enabled: !!isSignedIn },
  });
  const { data: referral, isLoading: referralLoading } = useGetMyReferralCode({
    query: { enabled: !!isSignedIn },
  });

  // ── Signed-out gate ──
  if (!isSignedIn) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <PageHeader title="Rewards & Points" />
        <View style={styles.gateContainer}>
          <View style={[styles.gateIcon, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}>
            <Feather name="award" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>Sign in to see your rewards</Text>
          <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
            Earn points by reporting on venues, leaving comments, and referring friends to ScenePulse.
          </Text>
          <Pressable
            onPress={() => router.push('/sign-in')}
            style={({ pressed }) => [
              styles.gateBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="user" size={15} color="#fff" />
            <Text style={styles.gateBtnText}>Sign in to get started</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PageHeader title="Rewards & Points" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page title ── */}
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          <Text style={{ color: colors.primary }}>Scene</Text>Pulse Rewards
        </Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
          Earn points every time you help keep the pulse feed accurate.
        </Text>

        {/* ── Level card ── */}
        {rewardsLoading ? (
          <SkeletonBlock height={130} />
        ) : rewards ? (
          <LevelCard
            points={rewards.points}
            level={rewards.level}
            nextLevel={rewards.nextLevel ?? null}
            pointsToNextLevel={rewards.pointsToNextLevel ?? null}
          />
        ) : null}

        {/* ── Referral ── */}
        <SectionLabel text="REFERRALS" />
        {referralLoading ? (
          <SkeletonBlock height={110} />
        ) : referral ? (
          <ReferralCard code={referral.code} usesCount={referral.usesCount} />
        ) : null}
        <RedeemCard />

        {/* ── How to earn ── */}
        <SectionLabel text="HOW TO EARN POINTS" />
        <View style={styles.earnStack}>
          {EARN_WAYS.map((w) => (
            <EarnRow key={w.label} icon={w.icon} label={w.label} pts={w.pts} desc={w.desc} />
          ))}
        </View>

        {/* ── Transaction history ── */}
        {rewards?.transactions && rewards.transactions.length > 0 && (
          <>
            <SectionLabel text="RECENT ACTIVITY" />
            <View style={styles.txStack}>
              {rewards.transactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  points={t.points}
                  reason={t.reason}
                  createdAt={t.createdAt}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // Scroll
  scroll: { padding: 16, paddingBottom: 48 },

  // Page title
  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginBottom: 4 },
  pageSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 20 },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },

  // Skeleton
  skeleton: { borderRadius: 14, borderWidth: 1, marginBottom: 20 },

  // Level card
  levelCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  levelMeta: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  levelName: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  levelPoints: { fontSize: 36, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  maxLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  maxLevelText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#f59e0b', letterSpacing: 0.3 },

  // Generic card
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  cardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },

  // Referral code display
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    marginBottom: 8,
  },
  codeText: {
    flex: 1,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 4,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shareBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  usesRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  usesText: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  // Redeem input
  redeemRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 3,
    textAlign: 'center',
  },
  redeemBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  redeemBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Earn ways
  earnStack: { gap: 8, marginBottom: 24 },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  earnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  earnText: { flex: 1 },
  earnLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  earnDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1, lineHeight: 15 },
  earnPts: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

  // Transactions
  txStack: { gap: 6, marginBottom: 24 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  txPoints: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    minWidth: 44,
    textAlign: 'right',
  },
  txReason: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  txDateRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  txDate: { fontSize: 10, fontFamily: 'Inter_500Medium' },

  // Signed-out gate
  gateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  gateIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  gateSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  gateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  gateBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
