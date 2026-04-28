import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import AppScaffold, { PageHeader } from '../../components/ui/AppScaffold';
import Reveal from '../../components/ui/Reveal';
import GlassCard from '../../components/ui/GlassCard';
import AppButton from '../../components/ui/AppButton';
import StatusPill from '../../components/ui/StatusPill';
import { palette, radii, spacing, typography } from '../../theme';

function DetailRow({ label, value, icon }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelWrap}>
        <MaterialCommunityIcons name={icon} size={16} color={palette.primaryStrong} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
  );
}

export default function PatientProfileScreen({ navigation, route }) {
  const { user, logout } = useAuth();
  const patientId = route?.params?.patientId;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);

  const isAdminView = user?.role === 'admin';

  const fetchProfile = async () => {
    setLoading(true);

    try {
      let profile;

      if (patientId) {
        const response = await axiosInstance.get(`/patients/${patientId}`);
        profile = response.data.data;
      } else {
        const response = await axiosInstance.get('/patients/me');
        profile = response.data.data;
      }

      setPatient(profile || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setPatient(null);
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const unsubscribe = navigation.addListener('focus', fetchProfile);
    return unsubscribe;
  }, [navigation, patientId]);

  const profileBadges = useMemo(() => {
    if (!patient) return [];

    return [
      patient.isActive === false ? { label: 'Archived', tone: 'danger' } : { label: 'Active', tone: 'success' },
      patient.bloodGroup ? { label: patient.bloodGroup, tone: 'accent' } : null,
      patient.gender ? { label: patient.gender, tone: 'primary' } : null,
      patient.phone ? { label: 'Contact ready', tone: 'success' } : null,
    ].filter(Boolean);
  }, [patient]);

  const handleArchive = async () => {
    if (!patient?._id) {
      return;
    }

    Alert.alert('Archive Patient', 'Remove this patient from active lists and keep the record for reference?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            setArchiving(true);
            await axiosInstance.delete(`/patients/${patient._id}`);
            Alert.alert('Archived', 'Patient moved out of the active list.');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to archive patient');
          } finally {
            setArchiving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <AppScaffold contentContainerStyle={styles.centeredContent}>
        <ActivityIndicator size="large" color={palette.primary} />
      </AppScaffold>
    );
  }

  if (!patient) {
    return (
      <AppScaffold contentContainerStyle={styles.centeredContent}>
        <Reveal delay={80}>
          <GlassCard style={styles.emptyCard} tint="accent">
            <Text style={styles.emptyTitle}>{isAdminView ? 'Patient record not found.' : 'No patient profile found.'}</Text>
            <Text style={styles.emptyText}>
              {isAdminView
                ? 'This profile may have been archived or the link is no longer valid.'
                : 'Create the profile once so appointments and emergency details stay connected.'}
            </Text>
            {!isAdminView ? (
              <AppButton label="Create Profile" onPress={() => navigation.navigate('PatientEdit')} style={{ marginTop: spacing.md }} />
            ) : null}
          </GlassCard>
        </Reveal>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold>
      <Reveal delay={30}>
        <PageHeader
          eyebrow={isAdminView ? 'Patient Overview' : (patientId ? 'Patient Overview' : 'My Profile')}
          title={isAdminView ? 'The patient context you need without the noise.' : (patientId ? 'A clearer snapshot of this patient.' : 'Your profile, arranged for quick confidence.')}
          subtitle={isAdminView
            ? 'Review the account, verify emergency details, and move directly into edits or archival.'
            : patientId
              ? 'Review profile essentials, care context, and emergency details without jumping between sections.'
              : 'Keep every care-critical detail accurate before the next appointment.'}
        />
      </Reveal>

      <Reveal delay={90}>
        <GlassCard style={styles.heroCard} tint="primary">
          <View style={styles.heroTopRow}>
            {patient.photoUrl ? (
              <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{patient.userId?.name?.charAt(0) || 'P'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{patient.userId?.name}</Text>
              <Text style={styles.email}>{patient.userId?.email}</Text>
              <View style={styles.badgeRow}>
                {profileBadges.map((badge) => (
                  <StatusPill key={badge.label} label={badge.label} tone={badge.tone} />
                ))}
              </View>
            </View>
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={140}>
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Profile essentials</Text>
          <View style={styles.detailStack}>
            <DetailRow label="Date of Birth" icon="cake-variant-outline" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toDateString() : null} />
            <DetailRow label="Phone" icon="phone-outline" value={patient.phone} />
            <DetailRow label="Address" icon="map-marker-outline" value={patient.address} />
            <DetailRow label="Allergies" icon="pill" value={patient.allergies?.join(', ')} />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={190}>
        <GlassCard style={styles.sectionCard} tint="accent">
          <Text style={styles.sectionTitle}>Emergency contact</Text>
          <View style={styles.detailStack}>
            <DetailRow label="Name" icon="account-heart-outline" value={patient.emergencyContact?.name} />
            <DetailRow label="Phone" icon="phone-alert-outline" value={patient.emergencyContact?.phone} />
            <DetailRow label="Relation" icon="family-tree" value={patient.emergencyContact?.relation} />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={230}>
        <AppButton
          label={isAdminView ? 'Edit Patient' : 'Edit Profile'}
          onPress={() => navigation.navigate('PatientEdit', { patient, mode: isAdminView ? 'adminEdit' : 'patientEdit' })}
          leftIcon={<MaterialCommunityIcons name="pencil-outline" size={18} color={palette.white} />}
          style={{ marginTop: spacing.sm }}
        />
      </Reveal>

      {isAdminView ? (
        <Reveal delay={260}>
          <AppButton
            label={archiving ? 'Archiving...' : 'Archive Patient'}
            variant="ghost"
            disabled={archiving || patient.isActive === false}
            onPress={handleArchive}
            leftIcon={<MaterialCommunityIcons name="archive-outline" size={18} color={palette.danger} />}
            style={{ marginTop: spacing.md }}
            textStyle={{ color: palette.danger }}
          />
        </Reveal>
      ) : null}

      {user?.role === 'patient' ? (
        <Reveal delay={290}>
          <AppButton
            label="Sign Out"
            variant="ghost"
            onPress={logout}
            leftIcon={<MaterialCommunityIcons name="logout-variant" size={18} color={palette.ink} />}
            style={{ marginTop: spacing.md }}
            textStyle={{ color: palette.ink }}
          />
        </Reveal>
      ) : null}
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  centeredContent: {
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyCard: {
    alignItems: 'flex-start',
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: 24,
    color: palette.ink,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: palette.inkSoft,
  },
  heroCard: {
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,107,99,0.12)',
  },
  avatarFallbackText: {
    fontFamily: typography.display,
    fontSize: 30,
    color: palette.primaryStrong,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 26,
    color: palette.ink,
  },
  email: {
    marginTop: 4,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: palette.inkSoft,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 22,
    color: palette.ink,
    marginBottom: 10,
  },
  detailStack: {
    gap: 8,
  },
  detailRow: {
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.48)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.inkSoft,
  },
  detailValue: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
    color: palette.ink,
  },
});
