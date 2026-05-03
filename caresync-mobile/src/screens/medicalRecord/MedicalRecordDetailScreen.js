import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getRecord, addAddendum, archiveRecord, deleteRecord } from '../../api/medicalRecordApi';
import { palette, radii, shadows, spacing, typography } from '../../theme';

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

function Section({ icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={18} color={palette.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function MedicalRecordDetailScreen({ route }) {
  const { recordId } = route.params;
  const navigation = useNavigation();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addendumText, setAddendumText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddendum, setShowAddendum] = useState(false);

  const fetchRecord = useCallback(async () => {
    try {
      const res = await getRecord(recordId);
      setRecord(res?.data?.data || null);
    } catch (err) { console.error('Failed to load record:', err.message); }
    finally { setLoading(false); }
  }, [recordId]);

  useFocusEffect(useCallback(() => { setLoading(true); fetchRecord(); }, [fetchRecord]));

  const handleAddAddendum = async () => {
    if (!addendumText.trim()) return;
    setSubmitting(true);
    try {
      await addAddendum(recordId, addendumText.trim());
      setAddendumText('');
      setShowAddendum(false);
      fetchRecord();
      Alert.alert('Success', 'Follow-up note added.');
    } catch (err) { Alert.alert('Error', err.response?.data?.error || err.message); }
    finally { setSubmitting(false); }
  };

  const handleArchive = () => {
    Alert.alert('Archive Record', 'Are you sure you want to archive this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: async () => {
        try {
          await archiveRecord(recordId);
          Alert.alert('Success', 'Record archived.');
          navigation.goBack();
        } catch (err) { Alert.alert('Error', err.response?.data?.error || err.message); }
      }},
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Record', 'Are you sure you want to permanently delete this record? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteRecord(recordId);
          Alert.alert('Success', 'Record deleted.');
          navigation.goBack();
        } catch (err) { Alert.alert('Error', err.response?.data?.error || err.message); }
      }},
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={palette.primary} /></View>;
  if (!record) return <View style={styles.center}><Text style={styles.emptyText}>Record not found</Text></View>;

  const patientName = record.patientId?.userId?.name || 'Unknown';
  const doctorName = record.doctorId?.userId?.name || 'Unknown';
  const vs = record.vitalSigns || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header card */}
      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateLabel}>{fmt(record.recordDate)}</Text>
            <Text style={styles.diagnosisTitle}>{record.diagnosis}</Text>
          </View>
          <View style={[styles.statusBadge, record.status === 'Archived' && styles.statusArchived]}>
            <Text style={[styles.statusText, record.status === 'Archived' && styles.statusArchivedText]}>{record.status}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="stethoscope" size={15} color={palette.primary} />
            <Text style={styles.metaText}>{doctorName}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account" size={15} color={palette.accent} />
            <Text style={styles.metaText}>{patientName}</Text>
          </View>
        </View>
      </View>

      {/* Symptoms */}
      {record.symptoms?.length > 0 && (
        <Section icon="alert-circle-outline" title="Symptoms">
          <View style={styles.tagWrap}>
            {record.symptoms.map((s, i) => (
              <View key={i} style={styles.symptomTag}>
                <Text style={styles.symptomText}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Treatment */}
      {record.treatment && (
        <Section icon="medical-bag" title="Treatment">
          <Text style={styles.bodyText}>{record.treatment}</Text>
        </Section>
      )}

      {/* Clinical Notes */}
      {record.notes && (
        <Section icon="note-text-outline" title="Clinical Notes">
          <Text style={styles.bodyText}>{record.notes}</Text>
        </Section>
      )}

      {/* Vital Signs */}
      {Object.values(vs).some(Boolean) && (
        <Section icon="heart-pulse" title="Vital Signs">
          <View style={styles.vitalsGrid}>
            {vs.bloodPressure && <VitalCard icon="blood-bag" label="Blood Pressure" value={vs.bloodPressure} />}
            {vs.heartRate && <VitalCard icon="heart" label="Heart Rate" value={`${vs.heartRate} bpm`} />}
            {vs.temperature && <VitalCard icon="thermometer" label="Temperature" value={`${vs.temperature}°C`} />}
            {vs.weight && <VitalCard icon="scale-bathroom" label="Weight" value={`${vs.weight} kg`} />}
            {vs.height && <VitalCard icon="human-male-height" label="Height" value={`${vs.height} cm`} />}
          </View>
        </Section>
      )}

      {/* Documents */}
      {record.documents?.length > 0 && (
        <Section icon="paperclip" title={`Documents (${record.documents.length})`}>
          {record.documents.map((doc, i) => (
            <TouchableOpacity key={i} style={styles.docRow} onPress={() => doc.fileUrl && Linking.openURL(doc.fileUrl)}>
              <MaterialCommunityIcons
                name={doc.fileType?.includes('pdf') ? 'file-pdf-box' : 'file-image'}
                size={24} color={doc.fileType?.includes('pdf') ? palette.danger : palette.primary}
              />
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{doc.fileName || 'Document'}</Text>
                <Text style={styles.docDate}>{fmt(doc.uploadedAt)}</Text>
              </View>
              <MaterialCommunityIcons name="open-in-new" size={16} color={palette.inkMuted} />
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {/* Prescriptions */}
      {record.prescriptions?.length > 0 && (
        <Section icon="pill" title={`Prescriptions (${record.prescriptions.length})`}>
          {record.prescriptions.map((rx) => (
            <View key={rx._id} style={styles.rxCard}>
              <View style={styles.rxHeader}>
                <Text style={styles.rxDate}>{fmt(rx.prescriptionDate)}</Text>
                <View style={[styles.rxBadge, rx.status === 'Completed' && styles.rxCompleted, rx.status === 'Cancelled' && styles.rxCancelled]}>
                  <Text style={styles.rxBadgeText}>{rx.status}</Text>
                </View>
              </View>
              {rx.medicines?.map((med, i) => (
                <View key={i} style={styles.medRow}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDetail}>{med.dosage} · {med.frequency}{med.duration ? ` · ${med.duration}` : ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </Section>
      )}

      {/* Addendums */}
      {record.addendums?.length > 0 && (
        <Section icon="history" title="Follow-up Notes">
          {record.addendums.map((a, i) => (
            <View key={i} style={styles.addendumCard}>
              <View style={styles.addendumHeader}>
                <Text style={styles.addendumAuthor}>{a.addedBy?.name || 'Unknown'}</Text>
                <Text style={styles.addendumDate}>{fmt(a.addedAt)} {fmtTime(a.addedAt)}</Text>
              </View>
              <Text style={styles.bodyText}>{a.text}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Add Addendum (Doctor only) */}
      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <View style={styles.addendumSection}>
          {!showAddendum ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddendum(true)}>
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={palette.primary} />
              <Text style={styles.addBtnText}>Add Follow-up Note</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addendumForm}>
              <TextInput
                style={styles.addendumInput}
                placeholder="Enter follow-up note..."
                placeholderTextColor={palette.inkMuted}
                value={addendumText}
                onChangeText={setAddendumText}
                multiline numberOfLines={3}
              />
              <View style={styles.addendumActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddendum(false); setAddendumText(''); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabled]} onPress={handleAddAddendum} disabled={submitting}>
                  {submitting ? <ActivityIndicator size="small" color={palette.white} /> : <Text style={styles.submitText}>Save Note</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Admin / Doctor Actions */}
      <View style={styles.actionRow}>
        {user?.role === 'admin' && (
          <>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.primary }]} onPress={() => navigation.navigate('CreateRecord', { editRecordId: recordId })}>
              <MaterialCommunityIcons name="pencil" size={16} color={palette.white} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.danger }]} onPress={handleDelete}>
              <MaterialCommunityIcons name="delete" size={16} color={palette.white} />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
        {(user?.role === 'doctor' && record.status === 'Active') && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.warning }]} onPress={handleArchive}>
            <MaterialCommunityIcons name="archive" size={16} color={palette.white} />
            <Text style={styles.actionBtnText}>Archive</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function VitalCard({ icon, label, value }) {
  return (
    <View style={styles.vitalCard}>
      <MaterialCommunityIcons name={icon} size={20} color={palette.primary} />
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvasBottom },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: typography.bodyMedium, color: palette.inkMuted, fontSize: 15 },
  headerCard: { backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: palette.line },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, marginRight: spacing.sm },
  dateLabel: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.primary, marginBottom: 4 },
  diagnosisTitle: { fontFamily: typography.display, fontSize: 20, color: palette.ink },
  statusBadge: { backgroundColor: palette.primarySoft, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 5 },
  statusArchived: { backgroundColor: palette.paperMuted },
  statusText: { fontFamily: typography.bodySemiBold, fontSize: 11, color: palette.primary },
  statusArchivedText: { color: palette.inkMuted },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: typography.bodyMedium, fontSize: 13, color: palette.inkSoft },
  section: { backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: palette.line },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: typography.bodySemiBold, fontSize: 14, color: palette.ink },
  bodyText: { fontFamily: typography.body, fontSize: 14, color: palette.inkSoft, lineHeight: 21 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomTag: { backgroundColor: palette.accentSoft, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 5 },
  symptomText: { fontFamily: typography.bodyMedium, fontSize: 12, color: palette.accent },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  vitalCard: { width: '47%', backgroundColor: palette.paperMuted, borderRadius: radii.sm, padding: spacing.sm, alignItems: 'center', gap: 4 },
  vitalLabel: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted, textAlign: 'center' },
  vitalValue: { fontFamily: typography.bodySemiBold, fontSize: 15, color: palette.ink },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: palette.line },
  docInfo: { flex: 1 },
  docName: { fontFamily: typography.bodyMedium, fontSize: 13, color: palette.ink },
  docDate: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted },
  rxCard: { backgroundColor: palette.paperMuted, borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.xs },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  rxDate: { fontFamily: typography.bodySemiBold, fontSize: 12, color: palette.inkSoft },
  rxBadge: { backgroundColor: palette.primarySoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  rxCompleted: { backgroundColor: '#E0F2E9' },
  rxCancelled: { backgroundColor: '#FDEAE8' },
  rxBadgeText: { fontFamily: typography.bodySemiBold, fontSize: 10, color: palette.primary },
  medRow: { marginBottom: 4 },
  medName: { fontFamily: typography.bodyMedium, fontSize: 13, color: palette.ink },
  medDetail: { fontFamily: typography.body, fontSize: 12, color: palette.inkMuted },
  addendumCard: { backgroundColor: palette.paperMuted, borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.xs, borderLeftWidth: 3, borderLeftColor: palette.accentWarm },
  addendumHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  addendumAuthor: { fontFamily: typography.bodySemiBold, fontSize: 12, color: palette.ink },
  addendumDate: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted },
  addendumSection: { marginTop: spacing.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, backgroundColor: palette.paper, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, borderStyle: 'dashed' },
  addBtnText: { fontFamily: typography.bodySemiBold, fontSize: 14, color: palette.primary },
  addendumForm: { backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: palette.line },
  addendumInput: { fontFamily: typography.body, fontSize: 14, color: palette.ink, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.sm, borderWidth: 1, borderColor: palette.line, borderRadius: radii.sm, padding: spacing.sm },
  addendumActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.sm },
  cancelText: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.inkMuted },
  submitBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: radii.sm, backgroundColor: palette.primary },
  submitText: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.white },
  disabled: { opacity: 0.5 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, justifyContent: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm },
  actionBtnText: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.white },
});
