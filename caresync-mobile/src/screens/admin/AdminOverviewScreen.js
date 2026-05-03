import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';
import AppScaffold, { PageHeader } from '../../components/ui/AppScaffold';
import AppButton from '../../components/ui/AppButton';
import GlassCard from '../../components/ui/GlassCard';
import Reveal from '../../components/ui/Reveal';
import StatusPill from '../../components/ui/StatusPill';
import { palette, radii, spacing, typography } from '../../theme';

function MetricTile({ label, value, icon, tone = 'primary' }) {
  const iconColor = tone === 'accent' ? palette.accent : palette.primaryStrong;

  return (
    <View style={styles.metricTile}>
      <View style={[styles.metricIcon, tone === 'accent' && styles.metricIconAccent]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatusStat({ label, value, tone }) {
  return (
    <View style={styles.statusStat}>
      <View style={styles.statusTopRow}>
        <Text style={styles.statusLabel}>{label}</Text>
        <StatusPill label={String(value)} tone={tone} />
      </View>
    </View>
  );
}

export default function AdminOverviewScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/overview');
      setOverview(response.data.data || null);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    const unsubscribe = navigation.addListener('focus', fetchOverview);
    return unsubscribe;
  }, [navigation]);

  const summary = overview?.summary || {};
  const patientSignals = overview?.patientSignals || {};
  const appointmentStatus = overview?.appointmentStatus || {};
  const recentPatients = overview?.recentPatients || [];
  const upcomingAppointments = overview?.upcomingAppointments || [];

  const signalTone = useMemo(
    () => (patientSignals.missingEmergencyContact ? 'warning' : 'success'),
    [patientSignals.missingEmergencyContact]
  );

  return (
    <AppScaffold>
      <Reveal delay={30}>
        <PageHeader
          eyebrow="Admin Command"
          title="See the clinic state before the day gets noisy."
          subtitle="Track patient readiness, appointment pressure, and follow-up gaps from one calm overview."
        />
      </Reveal>

      <Reveal delay={80}>
        <GlassCard style={styles.heroCard} tint="primary">
          <Text style={styles.heroKicker}>Live Snapshot</Text>
          <Text style={styles.heroTitle}>Manage intake, appointments, and profile quality from one place.</Text>
          <View style={styles.heroActionRow}>
            <AppButton
              label="Open Patients"
              onPress={() => navigation.navigate('Patients')}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Open Appointments"
              variant="accent"
              onPress={() => navigation.navigate('Appointments')}
              style={{ flex: 1 }}
            />
          </View>
        </GlassCard>
      </Reveal>

      {loading ? (
        <ActivityIndicator color={palette.primary} style={{ marginTop: 24 }} />
      ) : (
        <>
          <Reveal delay={120}>
            <GlassCard style={styles.metricCard}>
              <View style={styles.metricGrid}>
                <MetricTile label="Active Patients" value={summary.activePatients || 0} icon="account-group-outline" />
                <MetricTile label="Today's Visits" value={summary.todayAppointments || 0} icon="calendar-today" tone="accent" />
                <MetricTile label="Upcoming" value={summary.upcomingAppointments || 0} icon="calendar-clock-outline" />
                <MetricTile label="Care Team" value={summary.doctorsAvailable || 0} icon="stethoscope" tone="accent" />
                <MetricTile label="Prescriptions" value={summary.totalPrescriptions || 0} icon="pill" />
              </View>
            </GlassCard>
          </Reveal>

          <Reveal delay={170}>
            <GlassCard style={styles.signalCard} tint="accent">
              <View style={styles.signalTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Patient readiness</Text>
                  <Text style={styles.sectionText}>
                    Keep emergency and contact details complete so check-in and escalation stay fast.
                  </Text>
                </View>
                <StatusPill
                  label={patientSignals.missingEmergencyContact ? 'Needs follow-up' : 'Healthy'}
                  tone={signalTone}
                />
              </View>
              <View style={styles.signalRow}>
                <View style={styles.signalTile}>
                  <Text style={styles.signalValue}>{patientSignals.withEmergencyContact || 0}</Text>
                  <Text style={styles.signalLabel}>Emergency-ready</Text>
                </View>
                <View style={styles.signalTile}>
                  <Text style={styles.signalValue}>{patientSignals.missingEmergencyContact || 0}</Text>
                  <Text style={styles.signalLabel}>Missing contact</Text>
                </View>
                <View style={styles.signalTile}>
                  <Text style={styles.signalValue}>{summary.inactivePatients || 0}</Text>
                  <Text style={styles.signalLabel}>Archived</Text>
                </View>
              </View>
            </GlassCard>
          </Reveal>

          <Reveal delay={220}>
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Appointment status</Text>
              <View style={styles.statusStack}>
                <StatusStat label="Pending" value={appointmentStatus.Pending || 0} tone="warning" />
                <StatusStat label="Confirmed" value={appointmentStatus.Confirmed || 0} tone="primary" />
                <StatusStat label="Completed" value={appointmentStatus.Completed || 0} tone="success" />
                <StatusStat label="Cancelled" value={appointmentStatus.Cancelled || 0} tone="danger" />
              </View>
            </GlassCard>
          </Reveal>

          <Reveal delay={270}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent patient accounts</Text>
                <Pressable onPress={() => navigation.navigate('Patients')}>
                  <Text style={styles.inlineLink}>View all</Text>
                </Pressable>
              </View>

              {recentPatients.length ? recentPatients.map((patient) => (
                <Pressable
                  key={patient._id}
                  onPress={() => navigation.navigate('PatientProfile', { patientId: patient._id })}
                >
                  <View style={styles.listRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{patient.userId?.name?.charAt(0) || 'P'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>{patient.userId?.name || 'Unknown patient'}</Text>
                      <Text style={styles.listSubtitle}>{patient.userId?.email || 'No email on file'}</Text>
                    </View>
                    <StatusPill
                      label={patient.emergencyContact?.name ? 'Ready' : 'Needs info'}
                      tone={patient.emergencyContact?.name ? 'success' : 'warning'}
                    />
                  </View>
                </Pressable>
              )) : (
                <Text style={styles.sectionText}>Patient accounts will appear here as soon as they are created.</Text>
              )}
            </GlassCard>
          </Reveal>

          <Reveal delay={320}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Upcoming appointments</Text>
                <Pressable onPress={() => navigation.navigate('Appointments')}>
                  <Text style={styles.inlineLink}>Manage</Text>
                </Pressable>
              </View>

              {upcomingAppointments.length ? upcomingAppointments.map((appointment) => (
                <View key={appointment._id} style={styles.appointmentRow}>
                  <View style={styles.appointmentDay}>
                    <Text style={styles.appointmentDayText}>
                      {new Date(appointment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{appointment.patientId?.userId?.name || 'Unknown patient'}</Text>
                    <Text style={styles.listSubtitle}>
                      {appointment.doctorId?.userId?.name || 'Unknown doctor'} | {appointment.timeSlot}
                    </Text>
                  </View>
                  <StatusPill label={appointment.status} tone={appointment.status === 'Pending' ? 'warning' : 'primary'} />
                </View>
              )) : (
                <Text style={styles.sectionText}>There are no pending or confirmed appointments scheduled yet.</Text>
              )}
            </GlassCard>
          </Reveal>
        </>
      )}
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: spacing.md,
  },
  heroKicker: {
    fontFamily: typography.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: palette.primary,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: 24,
    lineHeight: 31,
    color: palette.ink,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
  },
  metricCard: {
    marginBottom: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricTile: {
    width: '47%',
    minWidth: 132,
    borderRadius: radii.md,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.56)',
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,107,99,0.10)',
    marginBottom: 14,
  },
  metricIconAccent: {
    backgroundColor: 'rgba(229,109,76,0.14)',
  },
  metricValue: {
    fontFamily: typography.display,
    fontSize: 28,
    color: palette.ink,
  },
  metricLabel: {
    marginTop: 6,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: palette.inkSoft,
  },
  signalCard: {
    marginBottom: spacing.md,
  },
  signalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: spacing.md,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  signalTile: {
    flex: 1,
    borderRadius: radii.md,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  signalValue: {
    fontFamily: typography.display,
    fontSize: 24,
    color: palette.ink,
  },
  signalLabel: {
    marginTop: 6,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: palette.inkSoft,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 21,
    color: palette.ink,
  },
  sectionText: {
    marginTop: 6,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
  statusStack: {
    gap: 10,
    marginTop: spacing.sm,
  },
  statusStat: {
    borderRadius: radii.md,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusLabel: {
    fontFamily: typography.bodySemiBold,
    fontSize: 14,
    color: palette.ink,
  },
  inlineLink: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.primaryStrong,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(228,217,200,0.72)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,107,99,0.12)',
  },
  avatarText: {
    fontFamily: typography.displayMedium,
    fontSize: 18,
    color: palette.primaryStrong,
  },
  listTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 17,
    color: palette.ink,
  },
  listSubtitle: {
    marginTop: 4,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: palette.inkSoft,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(228,217,200,0.72)',
  },
  appointmentDay: {
    minWidth: 72,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(229,109,76,0.12)',
  },
  appointmentDayText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: palette.accent,
    textAlign: 'center',
  },
});
