import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
} from 'react-native';

export default function PrescriptionDetailScreen({ route }) {
  const { prescription } = route.params;
  const expired = prescription.expiryDate && new Date(prescription.expiryDate) < new Date();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prescription</Text>
        <View style={[styles.badge, expired ? styles.expiredBadge : styles.activeBadge]}>
          <Text style={[styles.badgeText, expired ? styles.expiredText : styles.activeText]}>
            {expired ? 'Expired' : 'Active'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow label="Doctor" value={`Dr. ${prescription.doctorId?.userId?.name || 'N/A'}`} />
        <InfoRow label="Patient" value={prescription.patientId?.userId?.name || 'N/A'} />
        <InfoRow label="Issue Date" value={new Date(prescription.issueDate).toDateString()} />
        {prescription.expiryDate && (
          <InfoRow label="Expiry Date" value={new Date(prescription.expiryDate).toDateString()} />
        )}
        {prescription.refillsAllowed > 0 && (
          <InfoRow label="Refills" value={`${prescription.refillsUsed} / ${prescription.refillsAllowed} used`} />
        )}
        {prescription.instructions && (
          <InfoRow label="Instructions" value={prescription.instructions} />
        )}
      </View>

      <Text style={styles.sectionTitle}>Medicines</Text>
      {prescription.medicines?.map((med, idx) => (
        <View key={idx} style={styles.medCard}>
          <Text style={styles.medName}>{med.name}</Text>
          <View style={styles.medRow}>
            {med.dosage && <Text style={styles.medDetail}>💊 {med.dosage}</Text>}
            {med.frequency && <Text style={styles.medDetail}>🔁 {med.frequency}</Text>}
            {med.duration && <Text style={styles.medDetail}>⏱ {med.duration}</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  activeBadge: { backgroundColor: '#D1FAE5' },
  expiredBadge: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 13, fontWeight: '600' },
  activeText: { color: '#16A34A' },
  expiredText: { color: '#EF4444' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  fieldRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  value: { fontSize: 14, color: '#111827', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  medCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  medName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  medRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medDetail: { fontSize: 12, color: '#374151', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
});
