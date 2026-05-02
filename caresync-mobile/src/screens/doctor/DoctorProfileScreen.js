import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
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

const formatDays = (days = []) => (days.length ? days.join(', ') : 'Flexible schedule');

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

export default function DoctorProfileScreen({ navigation, route }) {
  const { user } = useAuth();
  const doctorId = route?.params?.doctorId;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isDoctorSelfView = user?.role === 'doctor' && !doctorId;
  const openBooking = () => navigation.navigate('Home', { screen: 'BookAppointment', params: { doctorId: doctor._id } });

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const endpoint = isDoctorSelfView ? '/doctors/me' : `/doctors/${doctorId}`;
      const response = await axiosInstance.get(endpoint);
      setDoctor(response.data.data || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setDoctor(null);
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to load doctor profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();

    const unsubscribe = navigation.addListener('focus', fetchDoctor);
    return unsubscribe;
  }, [navigation, doctorId, isDoctorSelfView]);

  const badges = useMemo(() => {
    if (!doctor) return [];

    return [
      doctor.isActive === false ? { label: 'Archived', tone: 'danger' } : { label: 'Active', tone: 'success' },
      doctor.specialisation ? { label: doctor.specialisation, tone: 'accent' } : null,
      Number.isFinite(doctor.experienceYears) ? { label: `${doctor.experienceYears} yrs`, tone: 'primary' } : null,
    ].filter(Boolean);
  }, [doctor]);

  const handleArchive = async () => {
    if (!doctor?._id) return;

    Alert.alert('Archive Doctor', 'Remove this doctor from active schedules and keep the record for reference?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            setArchiving(true);
            await axiosInstance.delete(`/doctors/${doctor._id}`);
            Alert.alert('Archived', 'Doctor moved out of the active care team.');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to archive doctor');
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

  if (!doctor) {
    return (
      <AppScaffold contentContainerStyle={styles.centeredContent}>
        <Reveal delay={80}>
          <GlassCard style={styles.emptyCard} tint="accent">
            <Text style={styles.emptyTitle}>Doctor profile not found.</Text>
            <Text style={styles.emptyText}>
              This profile may have been archived or the link is no longer valid.
            </Text>
          </GlassCard>
        </Reveal>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold>
      <Reveal delay={30}>
        <PageHeader
          eyebrow={isDoctorSelfView ? 'My Practice Profile' : 'Doctor Overview'}
          title={isDoctorSelfView
            ? 'Keep your public doctor profile accurate before the next booking.'
            : 'The clinical profile patients and staff should trust instantly.'}
          subtitle={isDoctorSelfView
            ? 'Update your visible details, schedule pattern, and consultation context from one place.'
            : 'Review expertise, availability, and account status without leaving the care workflow.'}
        />
      </Reveal>

      <Reveal delay={90}>
        <GlassCard style={styles.heroCard} tint="primary">
          <View style={styles.heroTopRow}>
            {doctor.photoUrl ? (
              <Image source={{ uri: doctor.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{doctor.userId?.name?.charAt(0) || 'D'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{doctor.userId?.name}</Text>
              <Text style={styles.email}>{doctor.userId?.email}</Text>
              <View style={styles.badgeRow}>
                {badges.map((badge) => (
                  <StatusPill key={badge.label} label={badge.label} tone={badge.tone} />
                ))}
              </View>
            </View>
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={140}>
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Practice details</Text>
          <View style={styles.detailStack}>
            <DetailRow label="Specialisation" icon="stethoscope" value={doctor.specialisation} />
            <DetailRow label="Qualification" icon="school-outline" value={doctor.qualification} />
            <DetailRow label="Experience" icon="medal-outline" value={Number.isFinite(doctor.experienceYears) ? `${doctor.experienceYears} years` : null} />
            <DetailRow label="Phone" icon="phone-outline" value={doctor.phone} />
            <DetailRow label="Consultation fee" icon="cash-multiple" value={Number.isFinite(doctor.consultationFee) ? `LKR ${doctor.consultationFee}` : null} />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={190}>
        <GlassCard style={styles.sectionCard} tint="accent">
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <Pressable onPress={openBooking} disabled={user?.role !== 'patient'}>
              {user?.role === 'patient' ? <Text style={styles.inlineLink}>Book with doctor</Text> : null}
            </Pressable>
          </View>
          <View style={styles.detailStack}>
            <DetailRow label="Working days" icon="calendar-range" value={formatDays(doctor.availableDays)} />
          </View>
          <View style={styles.slotWrap}>
            {(doctor.availableSlots || []).map((slot) => (
              <View key={slot} style={styles.slotChip}>
                <Text style={styles.slotChipText}>{slot}</Text>
              </View>
            ))}
            {!doctor.availableSlots?.length ? (
              <Text style={styles.emptyText}>No configured slots yet.</Text>
            ) : null}
          </View>
        </GlassCard>
      </Reveal>

      {user?.role === 'patient' ? (
        <Reveal delay={230}>
          <AppButton
            label="Book Appointment"
            variant="accent"
            onPress={openBooking}
            leftIcon={<MaterialCommunityIcons name="calendar-plus" size={18} color={palette.white} />}
            style={{ marginTop: spacing.sm }}
          />
        </Reveal>
      ) : null}

      {(isAdmin || isDoctorSelfView) ? (
        <Reveal delay={250}>
          <AppButton
            label={isAdmin ? 'Edit Doctor' : 'Edit My Profile'}
            onPress={() => navigation.navigate('DoctorEdit', { doctor, mode: isAdmin ? 'adminEdit' : 'doctorEdit' })}
            leftIcon={<MaterialCommunityIcons name="pencil-outline" size={18} color={palette.white} />}
            style={{ marginTop: spacing.sm }}
          />
        </Reveal>
      ) : null}

      {isAdmin ? (
        <Reveal delay={280}>
          <AppButton
            label={archiving ? 'Archiving...' : 'Archive Doctor'}
            variant="ghost"
            disabled={archiving || doctor.isActive === false}
            onPress={handleArchive}
            leftIcon={<MaterialCommunityIcons name="archive-outline" size={18} color={palette.danger} />}
            style={{ marginTop: spacing.md }}
            textStyle={{ color: palette.danger }}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 22,
    color: palette.ink,
  },
  inlineLink: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.primaryStrong,
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
  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: palette.line,
  },
  slotChipText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.ink,
  },
});
