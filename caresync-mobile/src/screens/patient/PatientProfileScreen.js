import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export default function PatientProfileScreen({ navigation, route }) {
  const { user, logout } = useAuth();
  const patientId = route?.params?.patientId;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let patient;
        if (patientId) {
          const res = await axiosInstance.get(`/patients/${patientId}`);
          patient = res.data.data;
        } else {
          const res = await axiosInstance.get('/patients/me');
          patient = res.data.data;
        }
        setPatient(patient || null);
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
    fetchProfile();
  }, [patientId]);

  if (loading) return <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1, marginTop: 80 }} />;

  if (!patient) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noProfile}>No profile found.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PatientEdit')}>
          <Text style={styles.buttonText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Field = ({ label, value }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {patient.photoUrl && (
        <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
      )}
      <Text style={styles.name}>{patient.userId?.name}</Text>
      <Text style={styles.email}>{patient.userId?.email}</Text>

      <View style={styles.card}>
        <Field label="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toDateString() : null} />
        <Field label="Gender" value={patient.gender} />
        <Field label="Phone" value={patient.phone} />
        <Field label="Address" value={patient.address} />
        <Field label="Blood Group" value={patient.bloodGroup} />
        <Field label="Allergies" value={patient.allergies?.join(', ')} />
      </View>

      {patient.emergencyContact?.name && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <Field label="Name" value={patient.emergencyContact.name} />
          <Field label="Phone" value={patient.emergencyContact.phone} />
          <Field label="Relation" value={patient.emergencyContact.relation} />
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PatientEdit', { patient })}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      {user?.role === 'patient' && (
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignSelf: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  email: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { color: '#6B7280', fontSize: 13 },
  value: { color: '#111827', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  button: { backgroundColor: '#2563EB', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  noProfile: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  logoutBtn: { backgroundColor: '#EF4444', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
