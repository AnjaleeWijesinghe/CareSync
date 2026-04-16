import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';

export default function MedicalRecordDetailScreen({ route }) {
  const { record } = route.params;

  const Field = ({ label, value }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.card}>
        <Text style={styles.title}>{record.diagnosis}</Text>
        <Text style={styles.date}>{new Date(record.recordDate).toDateString()}</Text>

        <Field label="Doctor" value={`Dr. ${record.doctorId?.userId?.name || 'N/A'}`} />
        <Field label="Treatment" value={record.treatment} />
        <Field label="Notes" value={record.notes} />
        {record.symptoms?.length > 0 && (
          <Field label="Symptoms" value={record.symptoms.join(', ')} />
        )}
      </View>

      {record.documents?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Documents</Text>
          {record.documents.map((doc, idx) => (
            <TouchableOpacity key={idx} style={styles.docRow} onPress={() => Linking.openURL(doc.fileUrl)}>
              <Text style={styles.docName}>📄 {doc.fileName}</Text>
              <Text style={styles.docDate}>{new Date(doc.uploadedAt).toDateString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  date: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  fieldRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  value: { fontSize: 14, color: '#111827', fontWeight: '500' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  docName: { color: '#2563EB', fontSize: 13, flex: 1 },
  docDate: { color: '#6B7280', fontSize: 12 },
});
