import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import AppScaffold, { PageHeader } from '../../components/ui/AppScaffold';
import Reveal from '../../components/ui/Reveal';
import GlassCard from '../../components/ui/GlassCard';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import StatusPill from '../../components/ui/StatusPill';
import { palette, radii, spacing, typography } from '../../theme';

function SnapshotTile({ label, value, icon, tone }) {
  return (
    <View style={styles.snapshotTile}>
      <View style={[styles.snapshotIcon, tone === 'accent' && styles.snapshotIconAccent]}>
        <MaterialCommunityIcons name={icon} size={18} color={tone === 'accent' ? palette.accent : palette.primaryStrong} />
      </View>
      <Text style={styles.snapshotValue}>{value}</Text>
      <Text style={styles.snapshotLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function PatientListScreen({ navigation }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchPatients = async (name = '') => {
    setLoading(true);
    try {
      const query = [];

      if (name) {
        query.push(`name=${encodeURIComponent(name)}`);
      }
      if (includeInactive) {
        query.push('includeInactive=true');
      }

      const basePath = name ? '/patients/search' : '/patients';
      const url = query.length ? `${basePath}?${query.join('&')}` : basePath;
      const response = await axiosInstance.get(url);
      setPatients(response.data.data || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    const unsubscribe = navigation.addListener('focus', () => fetchPatients(search));
    return unsubscribe;
  }, [navigation, search, includeInactive]);

  const summary = useMemo(() => ({
    total: patients.length,
    active: patients.filter((patient) => patient.isActive !== false).length,
    withEmergencyContact: patients.filter((patient) => patient.emergencyContact?.name).length,
  }), [patients]);

  const renderPatient = ({ item, index }) => (
    <Reveal delay={110 + index * 55}>
      <Pressable onPress={() => navigation.navigate('PatientProfile', { patientId: item._id })}>
        <GlassCard style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>{item.userId?.name?.charAt(0) || 'P'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{item.userId?.name || 'Unknown patient'}</Text>
              <Text style={styles.patientEmail}>{item.userId?.email}</Text>
            </View>
            <StatusPill
              label={item.isActive === false ? 'Archived' : (item.bloodGroup || 'Unspecified')}
              tone={item.isActive === false ? 'danger' : 'accent'}
            />
          </View>

          <View style={styles.patientMetaRow}>
            <View style={styles.patientMetaChip}>
              <MaterialCommunityIcons name="account-heart-outline" size={16} color={palette.primaryStrong} />
              <Text style={styles.patientMetaText}>{item.gender || 'Gender pending'}</Text>
            </View>
            <View style={styles.patientMetaChip}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={palette.primaryStrong} />
              <Text style={styles.patientMetaText}>{item.phone || 'Phone not added'}</Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Reveal>
  );

  return (
    <AppScaffold scroll={false} contentContainerStyle={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item._id}
        renderItem={renderPatient}
        onRefresh={() => fetchPatients(search)}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <>
            <Reveal delay={30}>
              <PageHeader
                eyebrow="Patient Management"
                title="Find the right person without scanning a noisy list."
                subtitle="Search fast, open a full profile, or create the next patient account without leaving the admin flow."
              />
            </Reveal>

            <Reveal delay={60}>
              <AppButton
                label="Create Patient Account"
                variant="accent"
                onPress={() => navigation.navigate('PatientEdit', { mode: 'adminCreate' })}
                style={{ marginBottom: spacing.md }}
              />
            </Reveal>

            <Reveal delay={80}>
              <GlassCard style={styles.searchCard} tint="primary">
                <AppInput
                  label="Search Patients"
                  icon="magnify"
                  placeholder="Search by patient name"
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={() => fetchPatients(search)}
                  returnKeyType="search"
                />

                {isAdmin ? (
                  <View style={styles.filterRow}>
                    <FilterChip label="Active only" active={!includeInactive} onPress={() => setIncludeInactive(false)} />
                    <FilterChip label="Include archived" active={includeInactive} onPress={() => setIncludeInactive(true)} />
                  </View>
                ) : null}
              </GlassCard>
            </Reveal>

            <Reveal delay={100}>
              <GlassCard style={styles.snapshotCard}>
                <View style={styles.snapshotRow}>
                  <SnapshotTile label="Profiles" value={summary.total} icon="account-group-outline" />
                  <SnapshotTile label="Active" value={summary.active} icon="check-decagram-outline" />
                  <SnapshotTile label="Emergency" value={summary.withEmergencyContact} icon="ambulance" tone="accent" />
                </View>
              </GlassCard>
            </Reveal>
          </>
        )}
        ListEmptyComponent={(
          !loading ? (
            <Reveal delay={130}>
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No patients found.</Text>
                <Text style={styles.emptyText}>Try a broader search term or create a patient account to get started.</Text>
              </GlassCard>
            </Reveal>
          ) : <ActivityIndicator color={palette.primary} style={{ marginTop: 24 }} />
        )}
      />
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: 128,
  },
  searchCard: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  filterChipActive: {
    backgroundColor: palette.primaryStrong,
    borderColor: palette.primaryStrong,
  },
  filterChipText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  filterChipTextActive: {
    color: palette.white,
  },
  snapshotCard: {
    marginBottom: spacing.md,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 12,
  },
  snapshotTile: {
    flex: 1,
  },
  snapshotIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(11,107,99,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  snapshotIconAccent: {
    backgroundColor: 'rgba(229,109,76,0.12)',
  },
  snapshotValue: {
    fontFamily: typography.display,
    fontSize: 28,
    color: palette.ink,
  },
  snapshotLabel: {
    marginTop: 6,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: palette.inkSoft,
  },
  patientCard: {
    marginBottom: spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(11,107,99,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.primaryStrong,
  },
  patientName: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.ink,
  },
  patientEmail: {
    marginTop: 4,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: palette.inkSoft,
  },
  patientMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  patientMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.56)',
  },
  patientMetaText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.inkSoft,
  },
  emptyCard: {
    marginTop: spacing.sm,
  },
  emptyTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 21,
    color: palette.ink,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
});
