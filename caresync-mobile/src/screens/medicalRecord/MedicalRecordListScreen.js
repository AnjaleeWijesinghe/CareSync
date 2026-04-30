import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMyRecords, getPatientRecords, searchRecords } from '../../api/medicalRecordApi';
import { palette, radii, shadows, spacing, typography } from '../../theme';

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MedicalRecordListScreen({ route }) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const externalPatientId = route?.params?.patientId;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      let res;
      if (externalPatientId) {
        res = await getPatientRecords(externalPatientId);
      } else if (user?.role === 'patient') {
        res = await getMyRecords({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      } else if (user?.role === 'doctor' || user?.role === 'admin') {
        const params = {};
        if (search.trim()) params.diagnosis = search.trim();
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        res = await searchRecords(params);
      }
      setRecords(res?.data?.data || []);
    } catch (err) {
      console.error('Failed to load records:', err.message);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, externalPatientId, search, dateFrom, dateTo]);

  useFocusEffect(useCallback(() => { setLoading(true); fetchRecords(); }, [fetchRecords]));

  const onRefresh = () => { setRefreshing(true); fetchRecords(); };

  const applySearch = () => { setLoading(true); fetchRecords(); };

  const renderTimelineItem = ({ item, index }) => {
    const patientName = item.patientId?.userId?.name || 'Unknown Patient';
    const doctorName = item.doctorId?.userId?.name || 'Unknown Doctor';
    const isLast = index === records.length - 1;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RecordDetail', { recordId: item._id })}
        style={styles.timelineRow}
      >
        {/* Timeline connector */}
        <View style={styles.timelineLeft}>
          <View style={[styles.dot, index === 0 && styles.dotFirst]} />
          {!isLast && <View style={styles.line} />}
        </View>

        {/* Card */}
        <View style={[styles.card, shadows.soft]}>
          <View style={styles.cardHeader}>
            <Text style={styles.dateText}>{fmt(item.recordDate)}</Text>
            <View style={[styles.badge, item.status === 'Archived' && styles.badgeArchived]}>
              <Text style={[styles.badgeText, item.status === 'Archived' && styles.badgeArchivedText]}>
                {item.status || 'Active'}
              </Text>
            </View>
          </View>

          <Text style={styles.diagnosis} numberOfLines={2}>{item.diagnosis}</Text>

          {item.symptoms?.length > 0 && (
            <View style={styles.tagRow}>
              {item.symptoms.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
              {item.symptoms.length > 3 && (
                <Text style={styles.moreText}>+{item.symptoms.length - 3}</Text>
              )}
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="stethoscope" size={14} color={palette.inkMuted} />
              <Text style={styles.footerText}>{doctorName}</Text>
            </View>
            {user?.role !== 'patient' && (
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="account" size={14} color={palette.inkMuted} />
                <Text style={styles.footerText}>{patientName}</Text>
              </View>
            )}
            {item.documents?.length > 0 && (
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="paperclip" size={14} color={palette.inkMuted} />
                <Text style={styles.footerText}>{item.documents.length}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      {user?.role !== 'patient' && (
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={palette.inkMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by diagnosis…"
              placeholderTextColor={palette.inkMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={applySearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
            <MaterialCommunityIcons name="filter-variant" size={20} color={showFilters ? palette.primary : palette.inkSoft} />
          </TouchableOpacity>
        </View>
      )}

      {/* Date filters */}
      {showFilters && (
        <View style={styles.filterRow}>
          <TextInput style={styles.dateInput} placeholder="From (YYYY-MM-DD)" placeholderTextColor={palette.inkMuted}
            value={dateFrom} onChangeText={setDateFrom} />
          <TextInput style={styles.dateInput} placeholder="To (YYYY-MM-DD)" placeholderTextColor={palette.inkMuted}
            value={dateTo} onChangeText={setDateTo} />
          <TouchableOpacity style={styles.applyBtn} onPress={applySearch}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={palette.primary} /></View>
      ) : records.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="file-document-outline" size={56} color={palette.paperStrong} />
          <Text style={styles.emptyTitle}>No Medical Records</Text>
          <Text style={styles.emptySubtitle}>Records will appear here once created.</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={renderTimelineItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
        />
      )}

      {/* Doctor FAB to create record */}
      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateRecord', { patientId: externalPatientId })}
        >
          <MaterialCommunityIcons name="plus" size={26} color={palette.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvasBottom },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: palette.paper,
    borderRadius: radii.sm, paddingHorizontal: spacing.sm, height: 44, borderWidth: 1, borderColor: palette.line,
  },
  searchInput: { flex: 1, marginLeft: spacing.xs, fontFamily: typography.body, fontSize: 14, color: palette.ink },
  filterBtn: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: palette.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: spacing.xs },
  dateInput: {
    flex: 1, height: 40, borderRadius: radii.sm, backgroundColor: palette.paper, paddingHorizontal: spacing.sm,
    fontFamily: typography.body, fontSize: 13, color: palette.ink, borderWidth: 1, borderColor: palette.line,
  },
  applyBtn: { height: 40, paddingHorizontal: spacing.md, borderRadius: radii.sm, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: palette.white, fontFamily: typography.bodySemiBold, fontSize: 13 },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },
  timelineRow: { flexDirection: 'row', marginBottom: spacing.xs },
  timelineLeft: { width: 28, alignItems: 'center', paddingTop: 18 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.primary, borderWidth: 2, borderColor: palette.primarySoft, zIndex: 1 },
  dotFirst: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, backgroundColor: palette.primarySoft, marginTop: -1 },
  card: {
    flex: 1, backgroundColor: palette.paper, borderRadius: radii.md, padding: spacing.md,
    marginLeft: spacing.sm, borderWidth: 1, borderColor: palette.line,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  dateText: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.primary },
  badge: { backgroundColor: palette.primarySoft, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeArchived: { backgroundColor: palette.paperMuted },
  badgeText: { fontFamily: typography.bodySemiBold, fontSize: 11, color: palette.primary },
  badgeArchivedText: { color: palette.inkMuted },
  diagnosis: { fontFamily: typography.bodyBold, fontSize: 15, color: palette.ink, marginBottom: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  tag: { backgroundColor: palette.accentSoft, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: typography.body, fontSize: 11, color: palette.accent },
  moreText: { fontFamily: typography.bodyMedium, fontSize: 11, color: palette.inkMuted, alignSelf: 'center' },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontFamily: typography.body, fontSize: 12, color: palette.inkMuted },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyTitle: { fontFamily: typography.displayMedium, fontSize: 17, color: palette.inkSoft, marginTop: spacing.md },
  emptySubtitle: { fontFamily: typography.body, fontSize: 13, color: palette.inkMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute', bottom: Platform.OS === 'web' ? 30 : 100, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: palette.primary,
    alignItems: 'center', justifyContent: 'center', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
});
