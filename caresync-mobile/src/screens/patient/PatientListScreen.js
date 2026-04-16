import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';

export default function PatientListScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPatients = async (name = '') => {
    setLoading(true);
    try {
      const url = name ? `/patients/search?name=${name}` : '/patients';
      const res = await axiosInstance.get(url);
      setPatients(res.data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PatientProfile', { patientId: item._id })}
    >
      <Text style={styles.name}>{item.userId?.name || 'N/A'}</Text>
      <Text style={styles.detail}>{item.userId?.email}</Text>
      <Text style={styles.detail}>Blood Group: {item.bloodGroup || 'N/A'} · {item.gender || 'N/A'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchPatients(search)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => fetchPatients(search)}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No patients found.</Text>}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchRow: { flexDirection: 'row', padding: 16, gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10 },
  searchBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  detail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
