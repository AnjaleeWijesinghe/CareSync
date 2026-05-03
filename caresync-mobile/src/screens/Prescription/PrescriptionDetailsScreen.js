import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPrescriptionById } from '../../api/prescriptionApi';

const PrescriptionDetailsScreen = ({ route }) => {
  const { id } = route.params;
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await getPrescriptionById(id);
        setPrescription(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#192f6a" />
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={styles.center}>
        <Text>Prescription not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#192f6a', '#3b5998']} style={styles.header}>
        <Text style={styles.patientName}>{prescription.patientName}</Text>
        <Text style={styles.doctorName}>By Dr. {prescription.doctorName}</Text>
        <Text style={styles.date}>{new Date(prescription.createdAt).toDateString()}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{prescription.diagnosis}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {prescription.medications.map((med, index) => (
            <View key={index} style={styles.medCard}>
              <Text style={styles.medName}>{med.medicineName}</Text>
              <View style={styles.medGrid}>
                <View style={styles.medInfo}>
                  <Text style={styles.medLabel}>Dosage</Text>
                  <Text style={styles.medValue}>{med.dosage}</Text>
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medLabel}>Frequency</Text>
                  <Text style={styles.medValue}>{med.frequency}</Text>
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medLabel}>Duration</Text>
                  <Text style={styles.medValue}>{med.duration}</Text>
                </View>
              </View>
              {med.instructions && (
                <Text style={styles.medInstructions}>Note: {med.instructions}</Text>
              )}
            </View>
          ))}
        </View>

        {prescription.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{prescription.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <Text style={[styles.statusValue, { color: prescription.status === 'active' ? '#4caf50' : '#f44336' }]}>
            {prescription.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 30, alignItems: 'center' },
  patientName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  doctorName: { color: '#e0e0e0', fontSize: 16, marginTop: 5 },
  date: { color: '#e0e0e0', fontSize: 12, marginTop: 10 },
  content: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#192f6a', marginBottom: 10 },
  infoBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  infoText: { fontSize: 16, color: '#333', lineHeight: 22 },
  medCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2
  },
  medName: { fontSize: 18, fontWeight: 'bold', color: '#3b5998', marginBottom: 10 },
  medGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  medInfo: { flex: 1 },
  medLabel: { fontSize: 12, color: '#888' },
  medValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  medInstructions: { marginTop: 10, fontSize: 13, color: '#666', fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 5 },
  footer: { marginTop: 20, padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  statusLabel: { fontSize: 14, color: '#888' },
  statusValue: { fontSize: 18, fontWeight: 'bold' }
});

export default PrescriptionDetailsScreen;
