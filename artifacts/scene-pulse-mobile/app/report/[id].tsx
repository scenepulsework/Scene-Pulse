import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useUser } from '@clerk/expo';
import {
  getGetVenueQueryKey,
  getListVenueReportsQueryKey,
  getListVenuesQueryKey,
  useCreateVenueReport,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { crowdColor } from '@/lib/venue-ui';

const LEVELS = [
  { key: 'open', label: 'Open', hint: 'Walk right in' },
  { key: 'lively', label: 'Lively', hint: 'Buzzing but moving' },
  { key: 'packed', label: 'Packed', hint: 'Shoulder to shoulder' },
] as const;

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const venueId = Number(idParam);

  const userDisplayName = user?.fullName || user?.firstName || '';

  const [reporterName, setReporterName] = useState('');
  const [crowdLevel, setCrowdLevel] = useState<'open' | 'lively' | 'packed'>('lively');
  const [waitTime, setWaitTime] = useState('10');
  const [vibeNote, setVibeNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pre-fill name from account when signed in
  useEffect(() => {
    if (userDisplayName && !reporterName) {
      setReporterName(userDisplayName);
    }
  }, [userDisplayName]);

  const { mutate, isPending } = useCreateVenueReport({
    mutation: {
      onSuccess: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListVenueReportsQueryKey(venueId) }),
          queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(venueId) }),
          queryClient.invalidateQueries({ queryKey: getListVenuesQueryKey() }),
        ]);
        router.back();
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError("Couldn't send your report. Try again.");
      },
    },
  });

  const submit = () => {
    setError(null);
    const wait = parseInt(waitTime, 10);
    if (!reporterName.trim()) return setError('Add a name so people know who reported.');
    if (Number.isNaN(wait) || wait < 0) return setError('Wait time must be 0 or more minutes.');
    if (!vibeNote.trim()) return setError('Drop a quick vibe note.');
    mutate({
      venueId,
      data: {
        reporterName: reporterName.trim(),
        crowdLevel,
        waitTimeMinutes: wait,
        vibeNote: vibeNote.trim(),
      },
    });
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 24 }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Drop a live report</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Update the crowd score for everyone heading out.
            </Text>
          </View>
          <Pressable testID="close-report" onPress={() => router.back()} hitSlop={10}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>HOW PACKED IS IT?</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((l) => {
            const active = crowdLevel === l.key;
            const c = crowdColor(l.key);
            return (
              <Pressable
                key={l.key}
                testID={`level-${l.key}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCrowdLevel(l.key);
                }}
                style={({ pressed }) => [
                  styles.levelBtn,
                  {
                    borderColor: active ? c : colors.border,
                    backgroundColor: active ? `${c}22` : colors.card,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.levelDot, { backgroundColor: c }]} />
                <Text
                  style={{
                    color: active ? colors.foreground : colors.mutedForeground,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                  }}
                >
                  {l.label}
                </Text>
                <Text style={[styles.levelHint, { color: colors.mutedForeground }]}>{l.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>WAIT TIME (MINUTES)</Text>
        <View style={styles.waitRow}>
          {['0', '10', '20', '30', '45', '60'].map((w) => (
            <Pressable
              key={w}
              testID={`wait-${w}`}
              onPress={() => {
                Haptics.selectionAsync();
                setWaitTime(w);
              }}
              style={[
                styles.waitChip,
                {
                  backgroundColor: waitTime === w ? colors.primary : colors.card,
                  borderColor: waitTime === w ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: waitTime === w ? colors.primaryForeground : colors.mutedForeground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 13,
                }}
              >
                {w}
              </Text>
            </Pressable>
          ))}
          <TextInput
            testID="wait-input"
            value={waitTime}
            onChangeText={setWaitTime}
            keyboardType="number-pad"
            style={[
              styles.waitInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>VIBE NOTE</Text>
        <TextInput
          testID="vibe-input"
          value={vibeNote}
          onChangeText={setVibeNote}
          placeholder="DJ just started, line moving fast…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.input,
            styles.vibeInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              borderRadius: colors.radius,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>YOUR NAME</Text>
        {userDisplayName ? (
          <View style={[styles.nameDisplay, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Feather name="user-check" size={15} color={colors.primary} />
            <Text style={[styles.nameDisplayText, { color: colors.foreground }]}>{userDisplayName}</Text>
          </View>
        ) : (
          <TextInput
            testID="name-input"
            value={reporterName}
            onChangeText={setReporterName}
            placeholder="Scene scout"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius,
              },
            ]}
          />
        )}

        {error && (
          <Text style={[styles.error, { color: colors.destructive }]} testID="report-error">
            {error}
          </Text>
        )}

        <Pressable
          testID="submit-report"
          onPress={submit}
          disabled={isPending}
          style={({ pressed }) => [
            styles.submit,
            {
              backgroundColor: colors.secondary,
              borderRadius: colors.radius,
              opacity: isPending ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {isPending ? (
            <ActivityIndicator color={colors.secondaryForeground} />
          ) : (
            <>
              <Feather name="zap" size={16} color={colors.secondaryForeground} />
              <Text style={[styles.submitText, { color: colors.secondaryForeground }]}>
                Send report
              </Text>
            </>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 14,
  },
  levelRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  levelBtn: { flex: 1, borderWidth: 1.5, padding: 12, gap: 4 },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  levelHint: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  waitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  waitChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  waitInput: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 56,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  vibeInput: { minHeight: 80, textAlignVertical: 'top' },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  nameDisplayText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  error: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 20,
    marginTop: 14,
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
  },
  submitText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
