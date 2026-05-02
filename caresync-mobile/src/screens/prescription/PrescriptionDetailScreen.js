import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getPrescription, refillPrescription } from '../../api/prescriptionApi';
import { palette, radii, shadows, spacing, typography } from '../../theme';

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PrescriptionDetailScreen({ route }) {
  const { prescriptionId } = route.params;
  const { user } = useAuth();
  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refilling, setRefilling] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await getPrescription(prescriptionId);
      setRx(res?.data?.data || null);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, [prescriptionId]);

  useFocusEffect(useCallback(() => { setLoading(true); fetch(); }, [fetch]));

  const handleRefill = async () => {
    Alert.alert('Refill Prescription', 'Are you sure you want to refill this prescription?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Refill', onPress: async () => {
        setRefilling(true);
        try {
          await refillPrescription(prescriptionId);
          fetch();
          Alert.alert('Success', 'Prescription refilled.');
        } catch (err) { Alert.alert('Error', err.response?.data?.error || err.message); }
        finally { setRefilling(false); }
      }},
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={palette.primary} /></View>;
  if (!rx) return <View style={styles.center}><Text style={styles.emptyText}>Prescription not found</Text></View>;

  const statusColor = { Active: palette.primary, Completed: palette.success, Cancelled: palette.danger }[rx.status] || palette.inkMuted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.headerRow}>
          <Text style={styles.dateLabel}>{fmt(rx.prescriptionDate)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{rx.status}</Text>
          </View>
        </View>
        {rx.recordId?.diagnosis && (
          <Text style={styles.diagnosisRef}>Linked: {rx.recordId.diagnosis}</Text>
        )}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="stethoscope" size={15} color={palette.primary} />
            <Text style={styles.metaText}>{rx.doctorId?.userId?.name || 'Doctor'}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account" size={15} color={palette.accent} />
            <Text style={styles.metaText}>{rx.patientId?.userId?.name || 'Patient'}</Text>
          </View>
          {rx.refillCount > 0 && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="refresh" size={15} color={palette.warning} />
              <Text style={styles.metaText}>Refills: {rx.refillCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Medicines */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="pill" size={18} color={palette.primary} />
        <Text style={styles.sectionTitle}>Medicines ({rx.medicines?.length || 0})</Text>
      </View>
      {rx.medicines?.map((med, i) => (
        <View key={i} style={[styles.medCard, shadows.soft]}>
          <View style={styles.medHeader}>
            <View style={styles.medIcon}>
              <MaterialCommunityIcons name="pill" size={20} color={palette.white} />
            </View>
            <Text style={styles.medName}>{med.name}</Text>
          </View>
          <View style={styles.medGrid}>
            <MedDetail icon="scale" label="Dosage" value={med.dosage} />
            <MedDetail icon="clock-outline" label="Frequency" value={med.frequency} />
            {med.duration && <MedDetail icon="calendar-range" label="Duration" value={med.duration} />}
            {med.instructions && <MedDetail icon="information-outline" label="Instructions" value={med.instructions} />}
          </View>
        </View>
      ))}

      {/* Notes */}
      {rx.notes && (
        <View style={styles.notesCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="note-text-outline" size={18} color={palette.primary} />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <Text style={styles.notesText}>{rx.notes}</Text>
        </View>
      )}

      {/* Doctor refill button */}
      {(user?.role === 'doctor' || user?.role === 'admin') && rx.status === 'Active' && (
        <TouchableOpacity style={[styles.refillBtn, refilling && styles.disabled]} onPress={handleRefill} disabled={refilling} activeOpacity={0.85}>
          {refilling ? <ActivityIndicator color={palette.white} /> : (
            <>
              <MaterialCommunityIcons name="refresh" size={20} color={palette.white} />
              <Text style={styles.refillText}>Refill Prescription</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MedDetail({ icon, label, value }) {
  return (
    <View style={styles.medDetailItem}>
      <MaterialCommunityIcons name={icon} size={14} color={palette.inkMuted} />
      <View>
        <Text style={styles.medDetailLabel}>{label}</Text>
        <Text style={styles.medDetailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvasBottom },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: typography.bodyMedium, color: palette.inkMuted, fontSize: 15 },
  headerCard: { backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: palette.line },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  dateLabel: { fontFamily: typography.bodySemiBold, fontSize: 14, color: palette.primary },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontFamily: typography.bodySemiBold, fontSize: 12 },
  diagnosisRef: { fontFamily: typography.body, fontSize: 13, color: palette.inkSoft, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: typography.bodyMedium, fontSize: 13, color: palette.inkSoft },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm, marginTop: spacing.xs },
  sectionTitle: { fontFamily: typography.bodySemiBold, fontSize: 15, color: palette.ink },
  medCard: { backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: palette.line },
  medHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  medIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  medName: { fontFamily: typography.bodyBold, fontSize: 16, color: palette.ink, flex: 1 },
  medGrid: { gap: spacing.sm },
  medDetailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  medDetailLabel: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted },
  medDetailValue: { fontFamily: typography.bodyMedium, fontSize: 13, color: palette.ink },
  notesCard: { backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: palette.line, marginTop: spacing.sm },
  notesText: { fontFamily: typography.body, fontSize: 14, color: palette.inkSoft, lineHeight: 21 },
  refillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: palette.warning, borderRadius: radii.sm, padding: spacing.md, marginTop: spacing.lg },
  refillText: { fontFamily: typography.bodySemiBold, fontSize: 15, color: palette.white },
  disabled: { opacity: 0.5 },
});
