import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAuditLogs } from '../../api/auditLogApi';
import { palette, radii, spacing, typography } from '../../theme';

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const actionIcons = { CREATE: 'plus-circle', READ: 'eye', UPDATE: 'pencil', DELETE: 'delete', UPLOAD: 'cloud-upload', DOWNLOAD: 'cloud-download' };
const actionColors = { CREATE: palette.success, READ: palette.primary, UPDATE: palette.warning, DELETE: palette.danger, UPLOAD: palette.accent, DOWNLOAD: palette.primary };

export default function AuditLogScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const params = { limit: 100 };
      if (filter !== 'All') params.action = filter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await getAuditLogs(params);
      setLogs(res?.data?.data || []);
    } catch (err) { console.error(err.message); setLogs([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter, dateFrom, dateTo]);

  useFocusEffect(useCallback(() => { setLoading(true); fetch(); }, [fetch]));

  const renderItem = ({ item }) => {
    const icon = actionIcons[item.action] || 'information';
    const color = actionColors[item.action] || palette.inkMuted;
    return (
      <View style={styles.logCard}>
        <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>
        <View style={styles.logContent}>
          <View style={styles.logTop}>
            <Text style={styles.logAction}>{item.action}</Text>
            <Text style={styles.logTime}>{fmt(item.timestamp)}</Text>
          </View>
          <Text style={styles.logDetail} numberOfLines={2}>{item.details || '—'}</Text>
          <View style={styles.logMeta}>
            <Text style={styles.logUser}>{item.userId?.name || 'Unknown'}</Text>
            <View style={styles.dot} />
            <Text style={styles.logRole}>{item.userRole}</Text>
            <View style={styles.dot} />
            <Text style={styles.logResource}>{item.resourceType}</Text>
          </View>
        </View>
      </View>
    );
  };

  const tabs = ['All', 'CREATE', 'READ', 'UPDATE', 'DELETE'];

  return (
    <View style={styles.container}>
      <View style={styles.tabScroll}>
        {tabs.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, filter === t && styles.tabActive]} onPress={() => setFilter(t)}>
            <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
          <MaterialCommunityIcons name="calendar-filter" size={18} color={showFilters ? palette.primary : palette.inkMuted} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterRow}>
          <TextInput style={styles.dateInput} placeholder="From (YYYY-MM-DD)" placeholderTextColor={palette.inkMuted}
            value={dateFrom} onChangeText={setDateFrom} />
          <TextInput style={styles.dateInput} placeholder="To (YYYY-MM-DD)" placeholderTextColor={palette.inkMuted}
            value={dateTo} onChangeText={setDateTo} />
          <TouchableOpacity style={styles.applyBtn} onPress={() => { setLoading(true); fetch(); }}>
            <Text style={styles.applyText}>Go</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={palette.primary} /></View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="shield-check-outline" size={52} color={palette.paperStrong} />
          <Text style={styles.emptyTitle}>No Audit Logs</Text>
        </View>
      ) : (
        <FlatList data={logs} keyExtractor={(i) => i._id} renderItem={renderItem}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={palette.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.canvasBottom },
  tabScroll: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs, alignItems: 'center' },
  tab: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: palette.paperMuted },
  tabActive: { backgroundColor: palette.primary },
  tabText: { fontFamily: typography.bodySemiBold, fontSize: 11, color: palette.inkMuted },
  tabTextActive: { color: palette.white },
  filterToggle: { marginLeft: 'auto', padding: 6 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: spacing.xs, alignItems: 'center' },
  dateInput: { flex: 1, height: 36, borderRadius: radii.sm, backgroundColor: palette.paper, paddingHorizontal: spacing.sm, fontFamily: typography.body, fontSize: 12, color: palette.ink, borderWidth: 1, borderColor: palette.line },
  applyBtn: { height: 36, paddingHorizontal: spacing.md, borderRadius: radii.sm, backgroundColor: palette.primary, justifyContent: 'center' },
  applyText: { color: palette.white, fontFamily: typography.bodySemiBold, fontSize: 12 },
  list: { padding: spacing.md, paddingBottom: 100 },
  logCard: { flexDirection: 'row', backgroundColor: palette.paper, borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.xs, borderWidth: 1, borderColor: palette.line, gap: spacing.sm },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logContent: { flex: 1 },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logAction: { fontFamily: typography.bodySemiBold, fontSize: 12, color: palette.ink },
  logTime: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted },
  logDetail: { fontFamily: typography.body, fontSize: 13, color: palette.inkSoft, marginVertical: 3 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logUser: { fontFamily: typography.bodyMedium, fontSize: 11, color: palette.primary },
  logRole: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted },
  logResource: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: palette.inkMuted },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyTitle: { fontFamily: typography.displayMedium, fontSize: 16, color: palette.inkSoft, marginTop: spacing.md },
});
