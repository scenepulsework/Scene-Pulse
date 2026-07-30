import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSignUp, useSSO } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { useColors } from '@/hooks/useColors';

export const PENDING_REFERRAL_CODE_KEY = 'pending_referral_code';

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Clerk v6 signals API: useSignUp returns { signUp, fetchStatus }
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = async () => {
    if (!signUp || loading) return;
    setError('');
    setLoading(true);
    try {
      // Create the sign-up with email + password
      const { error: createError } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });
      if (createError) {
        setError(createError.message || 'Sign up failed. Please try again.');
        return;
      }
      // Send the email verification code
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(sendError.message || 'Failed to send verification code. Please try again.');
        return;
      }
      setStep('verify');
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      const msg = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || 'Sign up failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp || loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setError(verifyError.message || 'Invalid code. Please try again.');
        return;
      }
      if (signUp.status === 'complete') {
        await signUp.finalize();
        // Persist any referral code so the root layout can redeem it once the
        // Clerk session is active (the token isn't available yet at this point).
        if (referralCode.trim()) {
          await SecureStore.setItemAsync(PENDING_REFERRAL_CODE_KEY, referralCode.trim());
        }
        router.replace('/');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      const msg = e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || 'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (googleLoading) return;
    setError('');
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch {
      setError('Google sign up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 40, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10} testID="close-signup">
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Brand */}
          <View style={styles.brand}>
            <Feather name="activity" size={28} color={colors.primary} />
            <Text style={[styles.brandText, { color: colors.foreground }]}>
              SCENE<Text style={{ color: colors.primary }}>PULSE</Text>
            </Text>
          </View>

          {step === 'form' ? (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>Create your account</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Track your favorite spots and get real-time crowd alerts.
              </Text>

              {/* Google OAuth */}
              <Pressable
                testID="google-signup"
                onPress={handleGoogleSignUp}
                disabled={googleLoading}
                style={({ pressed }) => [
                  styles.oauthBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed || googleLoading ? 0.7 : 1,
                  },
                ]}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <Feather name="globe" size={18} color={colors.foreground} />
                )}
                <Text style={[styles.oauthBtnText, { color: colors.foreground }]}>
                  Continue with Google
                </Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Email */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
              <TextInput
                testID="email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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

              {/* Password */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  testID="password-input"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: colors.radius,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.passwordToggle}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>

              {/* Referral code (optional) */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                REFERRAL CODE <Text style={[styles.labelOptional, { color: colors.mutedForeground }]}>(optional)</Text>
              </Text>
              <TextInput
                testID="referral-code-input"
                value={referralCode}
                onChangeText={(v) => setReferralCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. ABC12345"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
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

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]} testID="signup-error">
                  {error}
                </Text>
              ) : null}

              <Pressable
                testID="submit-signup"
                onPress={handleSignUp}
                disabled={loading || !signUp}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: loading || !signUp ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                    Create account
                  </Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                  Already have an account?{' '}
                </Text>
                <Pressable onPress={() => router.replace('/sign-in')} hitSlop={8}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Sign in</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>Check your email</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                We sent a 6-digit code to{' '}
                <Text style={{ color: colors.foreground }}>{email}</Text>. Enter it below to verify your account.
              </Text>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>VERIFICATION CODE</Text>
              <TextInput
                testID="code-input"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={6}
                style={[
                  styles.input,
                  styles.codeInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: colors.radius,
                  },
                ]}
              />

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]} testID="verify-error">
                  {error}
                </Text>
              ) : null}

              <Pressable
                testID="submit-verify"
                onPress={handleVerify}
                disabled={loading || !signUp}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: loading || !signUp ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                    Verify &amp; continue
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => { setStep('form'); setCode(''); setError(''); }}
                style={styles.backLink}
                hitSlop={8}
              >
                <Text style={[styles.footerLink, { color: colors.mutedForeground }]}>← Back</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  brandText: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 28 },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 20,
  },
  oauthBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  labelOptional: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
    textTransform: 'none',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
  },
  passwordRow: { position: 'relative', marginBottom: 0 },
  passwordInput: { paddingRight: 48, marginBottom: 14 },
  passwordToggle: { position: 'absolute', right: 14, top: 14 },
  codeInput: { fontSize: 24, textAlign: 'center', letterSpacing: 6, fontFamily: 'Inter_700Bold' },
  error: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 14, lineHeight: 18 },
  submitBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  footerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  backLink: { alignItems: 'center', marginTop: 8 },
});
