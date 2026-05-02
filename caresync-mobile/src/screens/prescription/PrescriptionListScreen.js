import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMyPrescriptions, getAllPrescriptions } from '../../api/prescriptionApi';
import { palette, radii, shadows, spacing, typography } from '../../theme';

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusColor = { Active: palette.primary, Completed: palette.success, Cancelled: palette.danger };

export default function PrescriptionListScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Active');

  const fetch = useCallback(async () => {
    try {
      const res = user?.role === 'patient'
        ? await getMyPrescriptions()
        : await getAllPrescriptions({ status: activeTab !== 'All' ? activeTab : undefined });
      setPrescriptions(res?.data?.data || []);
    } catch (err) { console.error(err.message); setPrescriptions([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user, activeTab]);

  useFocusEffect(useCallback(() => { setLoading(true); fetch(); }, [fetch]));

  const filtered = user?.role === 'patient'
    ? prescriptions.filter((p) => activeTab === 'All' || p.status === activeTab)
    : prescriptions;

  const renderItem = ({ item }) => {
    const doctorName = item.doctorId?.userId?.name || 'Doctor';
    const patientName = item.patientId?.userId?.name || 'Patient';
    const color = statusColor[item.status] || palette.inkMuted;

    return (
      <TouchableOpacity style={[styles.card, shadows.soft]} activeOpacity={0.7}
        onPress={() => navigation.navigate('PrescriptionDetail', { prescriptionId: item._id })}>
        <View style={styles.cardTop}>
          <Text style={styles.cardDate}>{fmt(item.prescriptionDate)}</Text>
          <View style={[styles.badge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.badgeText, { color }]}>{item.status}</Text>
          </View>
        </View>

        {item.recordId?.diagnosis && (
          <Text style={styles.diagnosisRef} numberOfLines={1}>
            <MaterialCommunityIcons name="file-document-outline" size={13} color={palette.inkMuted} /> {item.recordId.diagnosis}
          </Text>
        )}

        <View style={styles.medsWrap}>
          {item.medicines?.slice(0, 3).map((m, i) => (
            <View key={i} style={styles.medChip}>
              <MaterialCommunityIcons name="pill" size={12} color={palette.primary} />
              <Text style={styles.medChipText}>{m.name}</Text>
            </View>
          ))}
          {item.medicines?.length > 3 && <Text style={styles.moreText}>+{item.medicines.length - 3} more</Text>}
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="stethoscope" size={13} color={palette.inkMuted} />
            <Text style={styles.metaText}>{doctorName}</Text>
          </View>
          {user?.role !== 'patient' && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account" size={13} color={palette.inkMuted} />
              <Text style={styles.metaText}>{patientName}</Text>
            </View>
          )}
          {item.refillCount > 0 && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="refresh" size={13} color={palette.warning} />
              <Text style={styles.metaText}>Refill ×{item.refillCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const tabs = user?.role === 'patient' ? ['All', 'Active', 'Completed'] : ['Active', 'Completed', 'Cancelled'];

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={palette.primary} /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="pill" size={52} color={palette.paperStrong} />
          <Text style={styles.emptyTitle}>No Prescriptions</Text>
          <Text style={styles.emptySubtitle}>Prescriptions will appear here.</Text>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(i) => i._id} renderItem={renderItem}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={palette.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvasBottom },
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: palette.paperMuted },
  tabActive: { backgroundColor: palette.primary },
  tabText: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.inkMuted },
  tabTextActive: { color: palette.white },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: palette.line },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardDate: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.primary },
  badge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: typography.bodySemiBold, fontSize: 11 },
  diagnosisRef: { fontFamily: typography.body, fontSize: 12, color: palette.inkMuted, marginBottom: spacing.xs },
  medsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  medChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.primarySoft, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  medChipText: { fontFamily: typography.bodyMedium, fontSize: 12, color: palette.primaryStrong },
  moreText: { fontFamily: typography.body, fontSize: 12, color: palette.inkMuted, alignSelf: 'center' },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: typography.body, fontSize: 12, color: palette.inkMuted },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyTitle: { fontFamily: typography.displayMedium, fontSize: 17, color: palette.inkSoft, marginTop: spacing.md },
  emptySubtitle: { fontFamily: typography.body, fontSize: 13, color: palette.inkMuted, marginTop: spacing.xs },
});
