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

const formatDays = (days = []) => (days.length ? days.join(', ') : 'Flexible schedule');

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

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

export default function DoctorListScreen({ navigation }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSpecialisation, setSelectedSpecialisation] = useState('All');
  const [specialisations, setSpecialisations] = useState([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient';

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedSpecialisation !== 'All') {
        params.specialisation = selectedSpecialisation;
      }

      if (isAdmin && includeInactive) {
        params.includeInactive = true;
      }

      const response = await axiosInstance.get('/doctors', { params });
      setDoctors(response.data.data || []);
      setSpecialisations(response.data.meta?.specialisations || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();

    const unsubscribe = navigation.addListener('focus', fetchDoctors);
    return unsubscribe;
  }, [navigation, search, selectedSpecialisation, includeInactive]);

  const summary = useMemo(() => {
    const activeDoctors = doctors.filter((doctor) => doctor.isActive !== false);
    const feeSamples = activeDoctors
      .map((doctor) => doctor.consultationFee)
      .filter((value) => Number.isFinite(value));

    return {
      total: doctors.length,
      active: activeDoctors.length,
      specialisations: new Set(activeDoctors.map((doctor) => doctor.specialisation).filter(Boolean)).size,
      averageFee: feeSamples.length
        ? `LKR ${Math.round(feeSamples.reduce((sum, value) => sum + value, 0) / feeSamples.length)}`
        : 'N/A',
    };
  }, [doctors]);

  const renderDoctor = ({ item, index }) => (
    <Reveal delay={115 + index * 55}>
      <Pressable onPress={() => navigation.navigate('DoctorProfile', { doctorId: item._id })}>
        <GlassCard style={styles.doctorCard} tint={item.isActive === false ? 'accent' : 'neutral'}>
          <View style={styles.doctorHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.userId?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>{item.userId?.name || 'Unknown doctor'}</Text>
              <Text style={styles.doctorRole}>{item.specialisation || 'General Practice'}</Text>
            </View>
            <StatusPill
              label={item.isActive === false ? 'Archived' : (item.consultationFee ? `LKR ${item.consultationFee}` : 'Open')}
              tone={item.isActive === false ? 'danger' : 'accent'}
            />
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="school-outline" size={16} color={palette.primaryStrong} />
              <Text style={styles.metaChipText}>{item.qualification || 'Qualification on file'}</Text>
            </View>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="calendar-range" size={16} color={palette.primaryStrong} />
              <Text style={styles.metaChipText}>{formatDays(item.availableDays)}</Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.slotText}>
              {item.availableSlots?.length ? `${item.availableSlots.length} configured slots` : 'Slot setup pending'}
            </Text>
            <Text style={styles.linkText}>{isPatient ? 'View and book' : 'Open profile'}</Text>
          </View>
        </GlassCard>
      </Pressable>
    </Reveal>
  );

  const filterOptions = ['All', ...specialisations];

  return (
    <AppScaffold scroll={false} contentContainerStyle={styles.container}>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={renderDoctor}
        onRefresh={fetchDoctors}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <>
            <Reveal delay={30}>
              <PageHeader
                eyebrow={isAdmin ? 'Doctor Management' : 'Care Team'}
                title={isAdmin
                  ? 'Manage the clinicians patients will trust first.'
                  : 'Browse the doctors before you commit to a visit.'}
                subtitle={isAdmin
                  ? 'Search by name or specialisation, adjust live availability, and create new doctor accounts from one calm list.'
                  : 'Review specialisations, schedule patterns, and consultation fees before booking a time slot.'}
              />
            </Reveal>

            {isAdmin ? (
              <Reveal delay={60}>
                <AppButton
                  label="Create Doctor Account"
                  variant="accent"
                  onPress={() => navigation.navigate('DoctorEdit', { mode: 'adminCreate' })}
                  style={{ marginBottom: spacing.md }}
                />
              </Reveal>
            ) : null}

            <Reveal delay={80}>
              <GlassCard style={styles.searchCard} tint="primary">
                <AppInput
                  label="Search Doctors"
                  icon="magnify"
                  placeholder="Search by doctor name, specialisation, or qualification"
                  value={search}
                  onChangeText={setSearch}
                />

                <View style={styles.filterWrap}>
                  {filterOptions.map((option) => (
                    <FilterChip
                      key={option}
                      label={option}
                      active={selectedSpecialisation === option}
                      onPress={() => setSelectedSpecialisation(option)}
                    />
                  ))}
                </View>

                {isAdmin ? (
                  <View style={styles.filterWrap}>
                    <FilterChip label="Active only" active={!includeInactive} onPress={() => setIncludeInactive(false)} />
                    <FilterChip label="Include archived" active={includeInactive} onPress={() => setIncludeInactive(true)} />
                  </View>
                ) : null}
              </GlassCard>
            </Reveal>

            <Reveal delay={100}>
              <GlassCard style={styles.snapshotCard}>
                <View style={styles.snapshotRow}>
                  <SnapshotTile label="Doctors" value={summary.total} icon="stethoscope" />
                  <SnapshotTile label="Active" value={summary.active} icon="check-decagram-outline" />
                  <SnapshotTile label="Specialties" value={summary.specialisations} icon="heart-pulse" tone="accent" />
                  <SnapshotTile label="Avg. Fee" value={summary.averageFee} icon="cash-multiple" />
                </View>
              </GlassCard>
            </Reveal>
          </>
        )}
        ListEmptyComponent={(
          !loading ? (
            <Reveal delay={130}>
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No doctors found.</Text>
                <Text style={styles.emptyText}>
                  {isAdmin
                    ? 'Create a doctor account or widen the current filters to rebuild the care team view.'
                    : 'Try a different search term or specialisation to find the right doctor.'}
                </Text>
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
  filterWrap: {
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
    flexWrap: 'wrap',
    gap: 12,
  },
  snapshotTile: {
    width: '47%',
    minWidth: 132,
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
  doctorCard: {
    marginBottom: spacing.md,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(11,107,99,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.primaryStrong,
  },
  doctorName: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.ink,
  },
  doctorRole: {
    marginTop: 4,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: palette.inkSoft,
  },
  metaRow: {
    gap: 10,
    marginTop: spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.56)',
  },
  metaChipText: {
    flex: 1,
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.inkSoft,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: spacing.md,
  },
  slotText: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: palette.inkSoft,
  },
  linkText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.primaryStrong,
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
