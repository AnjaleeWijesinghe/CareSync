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
import { palette, spacing, typography } from '../../theme';

const VALUE_POINTS = [
  'Create your patient identity once',
  'Keep profile and emergency details ready',
  'Book future visits with fewer taps',
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim().toLowerCase(), password, 'patient');
      Alert.alert('Success', 'Patient account created. Please sign in.', [
        { text: 'Continue', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Could not register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppScaffold contentContainerStyle={styles.container}>
        <Reveal delay={40}>
          <PageHeader
            eyebrow="Patient Onboarding"
            title="Set up a profile that makes every future visit smoother."
            subtitle="Register once, then move through profile setup and appointment booking with less friction."
          />
        </Reveal>

        <Reveal delay={120} style={styles.badgeRow}>
          <StatusPill label="Patient only" tone="accent" />
          <StatusPill label="Fast setup" tone="primary" />
        </Reveal>

        <Reveal delay={180}>
          <GlassCard style={styles.storyCard} tint="accent">
            <View style={styles.storyHeader}>
              <View style={styles.storyBadge}>
                <MaterialCommunityIcons name="hand-heart" size={20} color={palette.accent} />
              </View>
              <Text style={styles.storyTitle}>What this gives you</Text>
            </View>
            <View style={styles.valueList}>
              {VALUE_POINTS.map((point, index) => (
                <View key={point} style={styles.valueItem}>
                  <View style={styles.valueIndex}>
                    <Text style={styles.valueIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.valueText}>{point}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Reveal>

        <Reveal delay={260}>
          <GlassCard style={styles.formCard}>
            <Text style={styles.formTitle}>Create your account</Text>
            <Text style={styles.formSubtitle}>Use details you can keep consistent with your clinic records.</Text>

            <View style={styles.fieldStack}>
              <AppInput
                label="Full Name"
                icon="account-outline"
                placeholder="Your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <AppInput
                label="Email Address"
                icon="email-outline"
                placeholder="care@domain.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppInput
                label="Password"
                icon="lock-outline"
                placeholder="Minimum 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <AppButton label="Create Patient Account" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.sm }} />

            <TouchableOpacity style={styles.secondaryLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.secondaryLinkText}>Already registered? Sign in instead</Text>
            </TouchableOpacity>
          </GlassCard>
        </Reveal>
      </AppScaffold>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  storyCard: {
    marginBottom: spacing.md,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  storyBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,109,76,0.14)',
  },
  storyTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 22,
    color: palette.ink,
  },
  valueList: {
    gap: 12,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueIndexText: {
    fontFamily: typography.bodyBold,
    color: palette.accent,
    fontSize: 12,
  },
  valueText: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
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
    marginTop: 6,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
  fieldStack: {
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
