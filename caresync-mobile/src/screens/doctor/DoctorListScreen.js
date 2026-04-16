import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';

export default function DoctorListScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async (specialisation = '') => {
    setLoading(true);
    try {
      const url = specialisation ? `/doctors?specialisation=${encodeURIComponent(specialisation)}` : '/doctors';
      const res = await axiosInstance.get(url);
      setDoctors(res.data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: item._id })}
    >
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👨‍⚕️</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.userId?.name || 'N/A'}</Text>
        <Text style={styles.spec}>{item.specialisation}</Text>
        <Text style={styles.detail}>{item.qualification} · {item.experienceYears} yrs exp</Text>
        {item.consultationFee && <Text style={styles.fee}>Fee: LKR {item.consultationFee}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by specialisation..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchDoctors(search)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => fetchDoctors(search)}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No doctors found.</Text>}
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  spec: { fontSize: 14, color: '#2563EB', marginTop: 2 },
  detail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  fee: { fontSize: 12, color: '#059669', marginTop: 2, fontWeight: '500' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
