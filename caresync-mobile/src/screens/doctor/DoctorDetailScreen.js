import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDetailScreen({ navigation, route }) {
  const { doctorId } = route.params;
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/doctors/${doctorId}`)
      .then(res => setDoctor(res.data.data))
      .catch(err => Alert.alert('Error', err.response?.data?.error || 'Failed to load doctor'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1, marginTop: 80 }} />;
  if (!doctor) return <Text style={{ textAlign: 'center', marginTop: 80 }}>Doctor not found.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        {doctor.photoUrl ? (
          <Image source={{ uri: doctor.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
          </View>
        )}
        <Text style={styles.name}>{doctor.userId?.name}</Text>
        <Text style={styles.spec}>{doctor.specialisation}</Text>
        <Text style={styles.sub}>{doctor.qualification}</Text>
      </View>

      <View style={styles.card}>
        <InfoRow label="Experience" value={`${doctor.experienceYears || 0} years`} />
        <InfoRow label="Phone" value={doctor.phone} />
        <InfoRow label="Consultation Fee" value={doctor.consultationFee ? `LKR ${doctor.consultationFee}` : 'N/A'} />
        <InfoRow label="Status" value={doctor.isActive ? 'Active' : 'Inactive'} />
      </View>

      {doctor.availableDays?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Days</Text>
          <View style={styles.chipRow}>
            {doctor.availableDays.map(d => (
              <View key={d} style={styles.chip}>
                <Text style={styles.chipText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {doctor.availableSlots?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Time Slots</Text>
          <View style={styles.chipRow}>
            {doctor.availableSlots.map(s => (
              <View key={s} style={[styles.chip, styles.slotChip]}>
                <Text style={styles.slotText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {user?.role === 'patient' && (
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('BookAppointment', { doctorId: doctor._id, doctorName: doctor.userId?.name })}
        >
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 40 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  spec: { fontSize: 16, color: '#2563EB', marginTop: 2 },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { color: '#6B7280', fontSize: 13 },
  value: { color: '#111827', fontSize: 13, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  chipText: { color: '#2563EB', fontSize: 13, fontWeight: '500' },
  slotChip: { backgroundColor: '#F0FDF4' },
  slotText: { color: '#16A34A', fontSize: 13, fontWeight: '500' },
  bookBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
