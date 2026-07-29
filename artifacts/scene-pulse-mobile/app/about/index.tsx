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

const ABOUT_VALUES = [
  {
    icon: 'zap' as const,
    title: 'Speed over polish',
    body: 'A crowd score that updates in 3 minutes beats a beautiful dashboard that updates in 30. We optimize for the moment you are standing on a sidewalk deciding where to go next.',
  },
  {
    icon: 'shield' as const,
    title: 'Data you can trust',
    body: 'We weight signals by recency and reporter credibility, expire stale reports automatically, and surface confidence levels so you know when a score is rock-solid vs. thin.',
  },
  {
    icon: 'globe' as const,
    title: 'Built for real cities',
    body: 'Calibrated to how actual people go out — neighborhoods, late nights, pop-up events, and the specific dynamics of each market. No generic one-size-fits-all crowding model.',
  },
  {
    icon: 'bar-chart-2' as const,
    title: 'Operators are partners',
    body: 'Venues deserve to understand their own demand signal. Operator access to live crowd analytics is a first-class product feature — not an afterthought bolted on later.',
  },
  {
    icon: 'users' as const,
    title: 'Community-sourced',
    body: 'ScenePulse runs on people who actually show up. Every report improves the score for everyone who checks next. The network effect is the product.',
  },
  {
    icon: 'lock' as const,
    title: 'Privacy by design',
    body: 'Reports are anonymized and aggregated. We never sell individual location history or behavior profiles. Your data fuels the feed — it does not become the product.',
  },
];

// ─── Sub-components (must precede components that use them) ─────────────────

function PageHeader({ title }: { title: string }) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        pageStyles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable onPress={() => router.back()} hitSlop={10} style={pageStyles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
      <Text style={[pageStyles.headerTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
}) {
  const colors = useColors();
  return (
    <View style={[pageStyles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[pageStyles.valueIconWrap, { backgroundColor: `${colors.primary}18` }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[pageStyles.valueTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[pageStyles.valueBody, { color: colors.mutedForeground }]}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AboutPage() {
  const colors = useColors();

  return (
    <View style={[pageStyles.screen, { backgroundColor: colors.background }]}>
      <PageHeader title="About ScenePulse" />

      <ScrollView contentContainerStyle={pageStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[pageStyles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={pageStyles.heroBrand}>
            <Feather name="activity" size={24} color={colors.primary} />
            <Text style={[pageStyles.heroBrandText, { color: colors.foreground }]}>
              SCENE<Text style={{ color: colors.primary }}>PULSE</Text>
            </Text>
          </View>
          <Text style={[pageStyles.heroTagline, { color: colors.foreground }]}>
            Know before you go.
          </Text>
          <Text style={[pageStyles.heroSub, { color: colors.mutedForeground }]}>
            Real-time crowd conditions for 725+ venues across 14 North American markets —
            sourced from locals who actually show up.
          </Text>
          <View style={pageStyles.heroStats}>
            {[
              { v: '725+', l: 'Venues', c: colors.primary },
              { v: '14', l: 'Markets', c: colors.secondary },
              { v: '2022', l: 'Founded', c: colors.foreground },
            ].map((s, i, arr) => (
              <React.Fragment key={s.l}>
                <View style={pageStyles.heroStatPill}>
                  <Text style={[pageStyles.heroStatValue, { color: s.c }]}>{s.v}</Text>
                  <Text style={[pageStyles.heroStatLabel, { color: colors.mutedForeground }]}>{s.l}</Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={[pageStyles.heroStatDivider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Origin story */}
        <Text style={[pageStyles.sectionLabel, { color: colors.mutedForeground }]}>OUR STORY</Text>
        <View style={[pageStyles.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[pageStyles.storyQuote, { color: colors.primary }]}>"</Text>
          <Text style={[pageStyles.storyBody, { color: colors.mutedForeground }]}>
            ScenePulse started after a Saturday night where three Ubers in a row showed up to dead
            venues. Not just quiet — dead quiet. Nobody could have known from looking at any app.
            The information existed somewhere — in the bartender's head, in the bouncer's count,
            in the people walking out — it just had no infrastructure to travel. We built that
            infrastructure.
          </Text>
          <View style={pageStyles.storyAttrib}>
            <View style={[pageStyles.storyAvatar, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[pageStyles.storyAvatarText, { color: colors.primary }]}>BG</Text>
            </View>
            <View>
              <Text style={[pageStyles.storyName, { color: colors.foreground }]}>Bradley Gilkerson</Text>
              <Text style={[pageStyles.storyTitle, { color: colors.mutedForeground }]}>Founder & CEO</Text>
            </View>
          </View>
        </View>

        {/* Values */}
        <Text style={[pageStyles.sectionLabel, { color: colors.mutedForeground }]}>OUR VALUES</Text>
        <View style={pageStyles.valuesStack}>
          {ABOUT_VALUES.map((v) => (
            <ValueCard key={v.title} icon={v.icon} title={v.title} body={v.body} />
          ))}
        </View>

        {/* Contact */}
        <Text style={[pageStyles.sectionLabel, { color: colors.mutedForeground }]}>GET IN TOUCH</Text>
        <View style={[pageStyles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'mail' as const, label: 'General', value: 'hello@scenepulse.app' },
            { icon: 'file-text' as const, label: 'Press', value: 'press@scenepulse.app' },
            { icon: 'briefcase' as const, label: 'Partnerships', value: 'partners@scenepulse.app' },
          ].map((c, i, arr) => (
            <View key={c.label}>
              <View style={pageStyles.contactRow}>
                <View style={[pageStyles.contactIconWrap, { backgroundColor: `${colors.primary}15` }]}>
                  <Feather name={c.icon} size={14} color={colors.primary} />
                </View>
                <View>
                  <Text style={[pageStyles.contactLabel, { color: colors.mutedForeground }]}>{c.label}</Text>
                  <Text style={[pageStyles.contactValue, { color: colors.foreground }]}>{c.value}</Text>
                </View>
              </View>
              {i < arr.length - 1 && (
                <View style={[pageStyles.contactDivider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>

        <Text style={[pageStyles.footer, { color: colors.mutedForeground }]}>
          © 2025 ScenePulse Technologies, Inc. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const pageStyles = StyleSheet.create({
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
  scroll: { padding: 16, paddingBottom: 48 },

  // Hero
  hero: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 24 },
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  heroBrandText: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  heroTagline: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginBottom: 8 },
  heroSub: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 20 },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStatPill: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  heroStatLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  heroStatDivider: { width: 1, height: 32 },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 4,
  },

  // Story
  storyCard: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 24 },
  storyQuote: { fontSize: 48, fontFamily: 'Inter_700Bold', lineHeight: 40, marginBottom: 4 },
  storyBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, marginBottom: 16 },
  storyAttrib: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  storyName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  storyTitle: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },

  // Values
  valuesStack: { gap: 10, marginBottom: 24 },
  valueCard: { flexDirection: 'row', gap: 14, borderWidth: 1, borderRadius: 14, padding: 16 },
  valueIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  valueTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  valueBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  // Contact
  contactCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  contactIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  contactValue: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 1 },
  contactDivider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },

  footer: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8 },
});
