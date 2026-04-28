import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import AppScaffold, { PageHeader } from '../../components/ui/AppScaffold';
import Reveal from '../../components/ui/Reveal';
import GlassCard from '../../components/ui/GlassCard';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import StatusPill from '../../components/ui/StatusPill';
import { palette, radii, spacing, typography } from '../../theme';

const HIGHLIGHTS = [
  { icon: 'shield-check-outline', label: 'Protected access' },
  { icon: 'calendar-clock-outline', label: 'Live scheduling' },
  { icon: 'heart-pulse', label: 'Patient-first records' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter your email address and password.');
      return;
    }

    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppScaffold contentContainerStyle={styles.container}>
        <Reveal delay={40}>
          <PageHeader
            align="center"
            eyebrow="Connected Care"
            title="A calmer way to manage appointments, profiles, and trust."
            subtitle="Sign in to continue into a streamlined care workflow designed for patients and staff."
          />
        </Reveal>

        <Reveal delay={120} style={styles.pillRow}>
          <StatusPill label="Secure access" tone="primary" />
          <StatusPill label="Fast scheduling" tone="accent" />
        </Reveal>

        <Reveal delay={180}>
          <GlassCard style={styles.heroCard} tint="primary">
            <Text style={styles.heroKicker}>Today’s Focus</Text>
            <Text style={styles.heroTitle}>One login. Fewer missed steps. Better care flow.</Text>
            <View style={styles.highlightList}>
              {HIGHLIGHTS.map((item) => (
                <View key={item.label} style={styles.highlightItem}>
                  <View style={styles.highlightIconWrap}>
                    <MaterialCommunityIcons name={item.icon} size={18} color={palette.primaryStrong} />
                  </View>
                  <Text style={styles.highlightText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Reveal>

        <Reveal delay={260}>
          <GlassCard style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Use the account connected to your clinic profile.</Text>

            <View style={styles.formFields}>
              <AppInput
                label="Email Address"
                icon="email-outline"
                placeholder="care@domain.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <AppInput
                label="Password"
                icon="lock-outline"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <AppButton label="Sign In Securely" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />

            <TouchableOpacity style={styles.secondaryLink} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.secondaryLinkText}>New patient? Create an account</Text>
            </TouchableOpacity>
          </GlassCard>
        </Reveal>
      </AppScaffold>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingTop: 20,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  heroCard: {
    marginBottom: spacing.md,
  },
  heroKicker: {
    fontFamily: typography.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.primary,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: 24,
    lineHeight: 30,
    color: palette.ink,
    marginBottom: spacing.md,
  },
  highlightList: {
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,107,99,0.12)',
  },
  highlightText: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: palette.inkSoft,
  },
  formCard: {
    paddingTop: 22,
  },
  formTitle: {
    fontFamily: typography.display,
    fontSize: 22,
    color: palette.ink,
  },
  formSubtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
    marginTop: 6,
  },
  formFields: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  secondaryLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 6,
  },
  secondaryLinkText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 14,
    color: palette.primaryStrong,
  },
});
