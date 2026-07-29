import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const MILESTONES = [
  {
    year: '2022',
    quarter: 'Q3',
    title: 'First Prototype',
    headline: '12 venues. One weekend.',
    description:
      'Built in 48 hours after a Saturday night of bad venue decisions. Launched to a group chat. By Monday, 60 friends were using it every weekend.',
    metrics: [
      { value: '12', label: 'Venues tracked' },
      { value: '60', label: 'Beta users' },
      { value: '48h', label: 'Time to launch' },
    ],
    icon: 'zap' as const,
    status: 'completed' as const,
    highlight: false,
  },
  {
    year: '2022',
    quarter: 'Q4',
    title: 'Kalamazoo Goes Live',
    headline: 'First real market.',
    description:
      'Formalized the reporter network in Kalamazoo, MI. Signed the first 5 venues as data partners. Proved that crowd scores update faster from community reports than from any sensor.',
    metrics: [
      { value: '5', label: 'Venue partners' },
      { value: '40+', label: 'Active reporters' },
      { value: '94%', label: 'Score accuracy' },
    ],
    icon: 'map-pin' as const,
    status: 'completed' as const,
    highlight: false,
  },
  {
    year: '2023',
    quarter: 'Q2',
    title: 'Chicago Launch',
    headline: 'First major metro.',
    description:
      "Expanded into Chicago's Wicker Park, River North, and Fulton Market districts. Proved the model scales — 80+ venues onboarded, 500+ verified reporters recruited in 60 days.",
    metrics: [
      { value: '80+', label: 'Venues' },
      { value: '500+', label: 'Reporters' },
      { value: '60', label: 'Days to scale' },
    ],
    icon: 'globe' as const,
    status: 'completed' as const,
    highlight: false,
  },
  {
    year: '2023',
    quarter: 'Q4',
    title: 'New York & LA',
    headline: 'Bi-coastal presence.',
    description:
      'Simultaneous launches in Manhattan (East Village, LES, Meatpacking) and Los Angeles (WeHo, Silver Lake). First national press coverage in Eater and The Infatuation.',
    metrics: [
      { value: '2', label: 'New markets' },
      { value: '180+', label: 'Venues added' },
      { value: '12k', label: 'Monthly actives' },
    ],
    icon: 'trending-up' as const,
    status: 'completed' as const,
    highlight: false,
  },
  {
    year: '2024',
    quarter: 'Q1',
    title: 'Series Seed',
    headline: '$3.2M raised.',
    description:
      'Closed a seed round from Metropolis Ventures and three strategic angel investors with backgrounds in hospitality tech. Used funding to build the operator dashboard and hire the first 4 full-time engineers.',
    metrics: [
      { value: '$3.2M', label: 'Raised' },
      { value: '4', label: 'New engineers' },
      { value: '8', label: 'Markets by EOY' },
    ],
    icon: 'award' as const,
    status: 'completed' as const,
    highlight: true,
  },
  {
    year: '2024',
    quarter: 'Q3',
    title: 'Operator Dashboard',
    headline: 'B2B product ships.',
    description:
      "Launched the first paid B2B tier — real-time crowd analytics for venue operators. Operators can see their own demand signal, peak time heatmaps, and competitor benchmarks. First $40k ARR.",
    metrics: [
      { value: '$40k', label: 'ARR at launch' },
      { value: '28', label: 'Paying operators' },
      { value: '4.8★', label: 'Operator rating' },
    ],
    icon: 'bar-chart-2' as const,
    status: 'completed' as const,
    highlight: false,
  },
  {
    year: '2025',
    quarter: 'Q1',
    title: 'Mobile App',
    headline: 'Native iOS & Android.',
    description:
      'Shipped the native mobile app on both platforms. Introduced Crowd Score badges, the Pulse Map, real-time push alerts for saved spots, and the reporter leaderboard.',
    metrics: [
      { value: '2', label: 'Platforms' },
      { value: '50k+', label: 'Downloads' },
      { value: '4.7★', label: 'App store' },
    ],
    icon: 'smartphone' as const,
    status: 'completed' as const,
    highlight: false,
  },
  {
    year: '2025',
    quarter: 'Q2–Q4',
    title: '14 Markets',
    headline: 'North America-wide.',
    description:
      'Reached 14 markets across the US and Canada. 725+ venues tracked live. Crowd scores now cover every major nightlife corridor in the network — from Austin 6th Street to Toronto\'s King West.',
    metrics: [
      { value: '725+', label: 'Venues live' },
      { value: '14', label: 'Markets' },
      { value: '3k+', label: 'Active reporters' },
    ],
    icon: 'activity' as const,
    status: 'current' as const,
    highlight: true,
  },
] as const;

// ─── Sub-components (defined before parent) ──────────────────────────────────

function PageHeader({ title }: { title: string }) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        msStyles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable onPress={() => router.back()} hitSlop={10} style={msStyles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
      <Text style={[msStyles.headerTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function MetricPill({ value, label }: { value: string; label: string }) {
  const colors = useColors();
  return (
    <View style={[msStyles.metric, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[msStyles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[msStyles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function MilestoneCard({
  item,
  isLast,
}: {
  item: (typeof MILESTONES)[number];
  isLast: boolean;
}) {
  const colors = useColors();
  const isCurrent = item.status === 'current';

  return (
    <View style={msStyles.milestoneWrap}>
      {/* Timeline track */}
      <View style={msStyles.track}>
        <View
          style={[
            msStyles.trackDot,
            {
              backgroundColor: isCurrent ? colors.primary : `${colors.primary}60`,
              borderColor: isCurrent ? colors.primary : colors.border,
              borderWidth: isCurrent ? 2 : 1,
            },
          ]}
        />
        {!isLast && (
          <View style={[msStyles.trackLine, { backgroundColor: colors.border }]} />
        )}
      </View>

      {/* Card */}
      <View
        style={[
          msStyles.card,
          {
            backgroundColor: colors.card,
            borderColor: isCurrent ? colors.primary : colors.border,
            borderWidth: isCurrent ? 1.5 : 1,
            marginBottom: isLast ? 0 : 20,
          },
        ]}
      >
        {/* Card header */}
        <View style={msStyles.cardHeader}>
          <View style={msStyles.cardYearRow}>
            <View
              style={[
                msStyles.yearBadge,
                { backgroundColor: isCurrent ? colors.primary : `${colors.primary}18` },
              ]}
            >
              <Text
                style={[
                  msStyles.yearText,
                  { color: isCurrent ? colors.primaryForeground : colors.primary },
                ]}
              >
                {item.year}
              </Text>
              <Text
                style={[
                  msStyles.quarterText,
                  { color: isCurrent ? `${colors.primaryForeground}b0` : `${colors.primary}90` },
                ]}
              >
                {item.quarter}
              </Text>
            </View>
            {item.highlight && (
              <View
                style={[
                  msStyles.highlightBadge,
                  { backgroundColor: `${colors.secondary}20`, borderColor: `${colors.secondary}40` },
                ]}
              >
                <Feather name="star" size={9} color={colors.secondary} />
                <Text style={[msStyles.highlightText, { color: colors.secondary }]}>Key milestone</Text>
              </View>
            )}
            {isCurrent && (
              <View
                style={[
                  msStyles.currentBadge,
                  { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}30` },
                ]}
              >
                <View style={[msStyles.currentDot, { backgroundColor: colors.success }]} />
                <Text style={[msStyles.currentText, { color: colors.success }]}>Current</Text>
              </View>
            )}
          </View>
          <View
            style={[
              msStyles.cardIconWrap,
              { backgroundColor: isCurrent ? `${colors.primary}20` : `${colors.primary}12` },
            ]}
          >
            <Feather
              name={item.icon}
              size={18}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Title & headline */}
        <Text style={[msStyles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[msStyles.cardHeadline, { color: colors.primary }]}>{item.headline}</Text>
        <Text style={[msStyles.cardDesc, { color: colors.mutedForeground }]}>{item.description}</Text>

        {/* Metrics row */}
        <View style={msStyles.metricsRow}>
          {item.metrics.map((m) => (
            <MetricPill key={m.label} value={m.value} label={m.label} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MilestonesPage() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[msStyles.screen, { backgroundColor: colors.background }]}>
      <PageHeader title="Milestones" />
      <ScrollView
        contentContainerStyle={[msStyles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[msStyles.intro, { color: colors.mutedForeground }]}>
          From a weekend prototype to North America's real-time crowd intelligence platform.
        </Text>
        <View style={msStyles.timeline}>
          {MILESTONES.map((m, i) => (
            <MilestoneCard key={`${m.year}-${m.title}`} item={m} isLast={i === MILESTONES.length - 1} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const msStyles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 16 },
  intro: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    marginBottom: 24,
  },
  timeline: {},
  milestoneWrap: { flexDirection: 'row', gap: 14 },
  track: { alignItems: 'center', width: 18, paddingTop: 16 },
  trackDot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  trackLine: { flex: 1, width: 1.5, marginTop: 6 },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardYearRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  yearText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  quarterText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  highlightText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  currentDot: { width: 6, height: 6, borderRadius: 3 },
  currentText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  cardHeadline: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  cardDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 14 },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  metricLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', textAlign: 'center', marginTop: 2 },
});
