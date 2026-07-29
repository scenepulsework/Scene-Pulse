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

const TEAM = [
  {
    id: 'bg',
    initials: 'BG',
    name: 'Bradley Gilkerson',
    title: 'Founder & CEO',
    location: 'Kalamazoo, MI',
    bio: 'Started ScenePulse after one too many wasted Ubers to dead bars. Built the first prototype in a weekend. Previously ran growth at two consumer apps and an event platform.',
    highlights: ['Founded 2022', '3 prior startups', 'Forbes 30u30 nominee'],
    accentColor: '#7c3aed',
    linkedIn: 'linkedin.com/in/bgilkerson',
  },
  {
    id: 'mw',
    initials: 'MW',
    name: 'Marcus Webb',
    title: 'Co-Founder & CTO',
    location: 'Chicago, IL',
    bio: 'Built the crowd-scoring engine and the live-signals pipeline. Architected the reporter weighting system that keeps scores trustworthy. Previously led data infrastructure at a top venue-discovery platform.',
    highlights: ['10+ yrs data infra', 'Ex-Yelp Insights', 'Ex-Foursquare'],
    accentColor: '#0891b2',
    linkedIn: 'linkedin.com/in/mwebb',
  },
  {
    id: 'pn',
    initials: 'PN',
    name: 'Priya Nallamothu',
    title: 'Head of Product',
    location: 'New York, NY',
    bio: "Translates raw signal into decisions you can make in 10 seconds. Owns the mobile app and operator dashboard UX. Obsessed with information density and the gap between data and action.",
    highlights: ['Ex-Airbnb Design', 'Ex-Foursquare PM', '5 shipped 0→1 products'],
    accentColor: '#db2777',
    linkedIn: 'linkedin.com/in/pnallamothu',
  },
  {
    id: 'jk',
    initials: 'JK',
    name: 'Jordan Kowalski',
    title: 'Head of Growth',
    location: 'Austin, TX',
    bio: 'Launched ScenePulse in 12 cities in 18 months. Builds and manages the reporter networks that make the data worth trusting. Pioneered the venue partnership model.',
    highlights: ['12 markets launched', '3k+ reporters recruited', 'Ex-Yelp Community'],
    accentColor: '#d97706',
    linkedIn: 'linkedin.com/in/jkowalski',
  },
  {
    id: 'sr',
    initials: 'SR',
    name: 'Sofia Reyes',
    title: 'Head of Operator Success',
    location: 'Los Angeles, CA',
    bio: 'Owns the relationship with every venue operator on the platform. Former GM at a 4-property hospitality group. Knows what operators actually need from crowd data — and what they ignore.',
    highlights: ['28 paying operators', '4.8★ NPS', 'Ex-Resy Partnerships'],
    accentColor: '#059669',
    linkedIn: 'linkedin.com/in/sreyes',
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
        teamStyles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable onPress={() => router.back()} hitSlop={10} style={teamStyles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
      <Text style={[teamStyles.headerTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function TeamCard({
  member,
}: {
  member: (typeof TEAM)[number];
}) {
  const colors = useColors();
  return (
    <View
      style={[
        teamStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Card top accent bar */}
      <View style={[teamStyles.accentBar, { backgroundColor: member.accentColor }]} />

      <View style={teamStyles.cardBody}>
        {/* Avatar + name block */}
        <View style={teamStyles.topRow}>
          <View
            style={[
              teamStyles.avatar,
              { backgroundColor: `${member.accentColor}20`, borderColor: `${member.accentColor}40` },
            ]}
          >
            <Text style={[teamStyles.avatarText, { color: member.accentColor }]}>
              {member.initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[teamStyles.name, { color: colors.foreground }]}>{member.name}</Text>
            <Text style={[teamStyles.role, { color: member.accentColor }]}>{member.title}</Text>
            <View style={teamStyles.locationRow}>
              <Feather name="map-pin" size={10} color={colors.mutedForeground} />
              <Text style={[teamStyles.locationText, { color: colors.mutedForeground }]}>
                {member.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <Text style={[teamStyles.bio, { color: colors.mutedForeground }]}>{member.bio}</Text>

        {/* Highlights pills */}
        <View style={teamStyles.highlights}>
          {member.highlights.map((h) => (
            <View
              key={h}
              style={[
                teamStyles.highlightPill,
                { backgroundColor: `${member.accentColor}12`, borderColor: `${member.accentColor}25` },
              ]}
            >
              <Text style={[teamStyles.highlightText, { color: member.accentColor }]}>{h}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function TeamPage() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[teamStyles.screen, { backgroundColor: colors.background }]}>
      <PageHeader title="Our Team" />
      <ScrollView
        contentContainerStyle={[teamStyles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[teamStyles.intro, { color: colors.mutedForeground }]}>
          A small, opinionated team that goes out often and builds fast.
        </Text>

        {TEAM.map((m) => (
          <TeamCard key={m.id} member={m} />
        ))}

        {/* Hiring note */}
        <View
          style={[
            teamStyles.hiringCard,
            { backgroundColor: `${colors.primary}0d`, borderColor: `${colors.primary}30` },
          ]}
        >
          <Feather name="briefcase" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[teamStyles.hiringTitle, { color: colors.foreground }]}>We're hiring</Text>
            <Text style={[teamStyles.hiringBody, { color: colors.mutedForeground }]}>
              Looking for engineers, city leads, and venue partnership managers. Say hi at jobs@scenepulse.app
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const teamStyles = StyleSheet.create({
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
  scroll: { padding: 16, gap: 14 },
  intro: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    marginBottom: 8,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  accentBar: { height: 4, width: '100%' },
  cardBody: { padding: 16 },
  topRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 20 },
  role: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  bio: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 12 },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  highlightPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  highlightText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  hiringCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
  },
  hiringTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  hiringBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
