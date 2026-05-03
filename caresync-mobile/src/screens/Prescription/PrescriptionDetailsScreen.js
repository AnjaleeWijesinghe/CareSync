import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getPrescriptionById, deletePrescription, updatePrescription } from '../../api/prescriptionApi';
import { useAuth } from '../../context/AuthContext';

export default function PrescriptionDetailsScreen({ route, navigation }) {
  const { prescriptionId } = route.params;
  const { user } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPrescription = useCallback(async () => {
    try {
      const res = await getPrescriptionById(prescriptionId);
      setPrescription(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load prescription details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [prescriptionId, navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPrescription();
    }, [fetchPrescription])
  );

  const handleDelete = async () => {
    Alert.alert('Delete Prescription', 'Are you sure you want to delete this prescription?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePrescription(prescriptionId);
            Alert.alert('Success', 'Prescription deleted successfully');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete prescription');
          }
        }
      }
    ]);
  };

  const markCompleted = async () => {
    try {
      await updatePrescription(prescriptionId, { status: 'completed' });
      Alert.alert('Success', 'Prescription marked as completed');
      fetchPrescription();
    } catch (error) {
      Alert.alert('Error', 'Failed to update prescription');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#192f6a" />
      </View>
    );
  }

  if (!prescription) return null;

  const statusColors = { active: '#4CAF50', completed: '#2196F3', cancelled: '#F44336' };
  const color = statusColors[prescription.status] || '#888';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Prescription Overview</Text>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{prescription.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>Date: {new Date(prescription.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={20} color="#555" />
          <Text style={styles.infoText}>Patient: {prescription.patientName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="stethoscope" size={20} color="#555" />
          <Text style={styles.infoText}>Doctor: {prescription.doctorName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#555" />
          <Text style={styles.infoText}>Diagnosis: {prescription.diagnosis}</Text>
        </View>
        {prescription.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{prescription.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medications</Text>
        {prescription.medications && prescription.medications.map((med, idx) => (
          <View key={idx} style={styles.medCard}>
            <Text style={styles.medName}>{med.medicineName}</Text>
            <View style={styles.medDetailRow}>
              <Text style={styles.medDetailLabel}>Dosage:</Text>
              <Text style={styles.medDetailValue}>{med.dosage || 'N/A'}</Text>
            </View>
            <View style={styles.medDetailRow}>
              <Text style={styles.medDetailLabel}>Frequency:</Text>
              <Text style={styles.medDetailValue}>{med.frequency || 'N/A'}</Text>
            </View>
            <View style={styles.medDetailRow}>
              <Text style={styles.medDetailLabel}>Duration:</Text>
              <Text style={styles.medDetailValue}>{med.duration || 'N/A'}</Text>
            </View>
            {med.instructions ? (
              <View style={styles.medDetailRow}>
                <Text style={styles.medDetailLabel}>Instructions:</Text>
                <Text style={styles.medDetailValue}>{med.instructions}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <View style={styles.actionButtons}>
          {prescription.status === 'active' && (
            <TouchableOpacity style={styles.completeBtn} onPress={markCompleted}>
              <Text style={styles.btnText}>Mark Completed</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#192f6a' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  dateText: { color: '#888', marginTop: 10 },
  section: { backgroundColor: '#fff', padding: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 16, color: '#444', marginLeft: 10 },
  notesBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginTop: 10 },
  notesTitle: { fontWeight: 'bold', color: '#555', marginBottom: 5 },
  notesText: { color: '#666', lineHeight: 22 },
  medCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  medName: { fontSize: 16, fontWeight: 'bold', color: '#192f6a', marginBottom: 10 },
  medDetailRow: { flexDirection: 'row', marginBottom: 5 },
  medDetailLabel: { width: 90, color: '#666', fontWeight: '500' },
  medDetailValue: { flex: 1, color: '#333' },
  actionButtons: { padding: 20, paddingBottom: 40, gap: 10 },
  completeBtn: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
