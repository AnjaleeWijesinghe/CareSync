import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export default function MedicalRecordListScreen({ navigation }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url;
      if (user?.role === 'admin') {
        url = '/records';
      } else if (user?.role === 'patient') {
        const meRes = await axiosInstance.get('/patients/me');
        const mine = meRes.data.data;
        if (!mine) { setRecords([]); setLoading(false); return; }
        url = `/records/patient/${mine._id}`;
      } else {
        url = '/records';
      }
      const res = await axiosInstance.get(url);
      setRecords(res.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setRecords([]);
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to load records');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const renderItem = ({ item }) => {
    const date = new Date(item.recordDate).toDateString();
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RecordDetail', { record: item })}
      >
        <View style={styles.timeline}>
          <View style={styles.dot} />
          <View style={styles.line} />
        </View>
        <View style={styles.content}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.diagnosis}>{item.diagnosis}</Text>
          <Text style={styles.doctor}>Dr. {item.doctorId?.userId?.name || 'N/A'}</Text>
          {item.treatment && <Text style={styles.treatment}>{item.treatment}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No medical records found.</Text>}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={fetchRecords}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { flexDirection: 'row', marginBottom: 12 },
  timeline: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2563EB', marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: '#BFDBFE', marginTop: 2 },
  content: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginLeft: 8, elevation: 2 },
  date: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  diagnosis: { fontSize: 15, fontWeight: '600', color: '#111827' },
  doctor: { fontSize: 13, color: '#2563EB', marginTop: 2 },
  treatment: { fontSize: 13, color: '#374151', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
