import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { getPrescriptions } from '../../api/prescriptionApi';

const PrescriptionListScreen = ({ navigation }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('active');

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await getPrescriptions();
      setPrescriptions(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const filteredData = prescriptions.filter(p => p.status === filter);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('PrescriptionDetails', { id: item._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#4caf50' : '#f44336' }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.diagnosis} numberOfLines={1}>{item.diagnosis}</Text>
      <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
      
      <View style={styles.medSummary}>
        <Text style={styles.medCount}>{item.medications.length} Medication(s)</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {['active', 'completed', 'cancelled'].map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPrescriptions} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {filter} prescriptions found</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePrescription')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterBar: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', elevation: 2 },
  filterBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 20 },
  filterBtnActive: { backgroundColor: '#192f6a' },
  filterBtnText: { color: '#666', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  list: { padding: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#3b5998'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  diagnosis: { fontSize: 14, color: '#666', marginBottom: 5, fontStyle: 'italic' },
  doctorName: { fontSize: 14, color: '#3b5998', fontWeight: '600' },
  medSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  medCount: { fontSize: 12, color: '#888' },
  date: { fontSize: 12, color: '#888' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#192f6a',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' }
});

export default PrescriptionListScreen;
