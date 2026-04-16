import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  Pending: '#F59E0B',
  Confirmed: '#2563EB',
  Completed: '#16A34A',
  Cancelled: '#EF4444',
};

export default function AppointmentListScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const url = user?.role === 'patient' ? '/appointments/my' : '/appointments';
      const res = await axiosInstance.get(url);
      setAppointments(res.data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          try {
            await axiosInstance.delete(`/appointments/${id}`);
            fetchAppointments();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const doctor = item.doctorId?.userId?.name || item.doctorId?.name || 'N/A';
    const patient = item.patientId?.userId?.name || item.patientId?.name || 'N/A';
    const statusColor = STATUS_COLORS[item.status] || '#6B7280';
    const date = new Date(item.date).toDateString();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.docName}>{user?.role === 'patient' ? `Dr. ${doctor}` : patient}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.detail}>📅 {date} · ⏰ {item.timeSlot}</Text>
        {item.reason && <Text style={styles.reason}>{item.reason}</Text>}

        {item.status === 'Pending' && user?.role === 'patient' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item._id)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {user?.role === 'patient' && (
        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Doctors')}>
          <Text style={styles.newBtnText}>+ Book New Appointment</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No appointments found.</Text>}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={fetchAppointments}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  newBtn: { margin: 16, backgroundColor: '#2563EB', borderRadius: 8, padding: 12, alignItems: 'center' },
  newBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  docName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  detail: { fontSize: 13, color: '#6B7280' },
  reason: { fontSize: 13, color: '#374151', marginTop: 4, fontStyle: 'italic' },
  cancelBtn: { marginTop: 10, borderWidth: 1, borderColor: '#EF4444', borderRadius: 6, padding: 8, alignItems: 'center' },
  cancelText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
