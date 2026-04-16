import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export default function PrescriptionListScreen({ navigation }) {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'expired'
  const [loading, setLoading] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      let url;
      if (user?.role === 'patient') {
        url = filter === 'all' ? '/prescriptions/my' : `/prescriptions/my?status=${filter}`;
      } else {
        url = '/prescriptions';
      }
      const res = await axiosInstance.get(url);
      setPrescriptions(res.data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, [filter]);

  const isExpired = (item) => item.expiryDate && new Date(item.expiryDate) < new Date();

  const renderItem = ({ item }) => {
    const expired = isExpired(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PrescriptionDetail', { prescription: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.doctor}>Dr. {item.doctorId?.userId?.name || 'N/A'}</Text>
          <View style={[styles.badge, expired ? styles.expiredBadge : styles.activeBadge]}>
            <Text style={[styles.badgeText, expired ? styles.expiredText : styles.activeText]}>
              {expired ? 'Expired' : 'Active'}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>Issued: {new Date(item.issueDate).toDateString()}</Text>
        <Text style={styles.medicines}>{item.medicines?.length || 0} medicine(s)</Text>
        {item.refillsAllowed > 0 && (
          <Text style={styles.refills}>Refills: {item.refillsUsed}/{item.refillsAllowed}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {user?.role === 'patient' && (
        <View style={styles.tabs}>
          {['all', 'active', 'expired'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, filter === f && styles.tabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No prescriptions found.</Text>}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={fetchPrescriptions}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#E5E7EB', borderRadius: 8, padding: 4 },
  tab: { flex: 1, padding: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#111827', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  doctor: { fontSize: 15, fontWeight: '600', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: '#D1FAE5' },
  expiredBadge: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  activeText: { color: '#16A34A' },
  expiredText: { color: '#EF4444' },
  date: { fontSize: 13, color: '#6B7280' },
  medicines: { fontSize: 13, color: '#374151', marginTop: 2 },
  refills: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
