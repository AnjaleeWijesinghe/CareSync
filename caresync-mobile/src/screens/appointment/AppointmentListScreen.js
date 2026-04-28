import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScaffold, { PageHeader } from '../../components/ui/AppScaffold';
import Reveal from '../../components/ui/Reveal';
import GlassCard from '../../components/ui/GlassCard';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import StatusPill from '../../components/ui/StatusPill';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { palette, radii, spacing, typography } from '../../theme';

const STATUS_TONES = {
  Pending: 'warning',
  Confirmed: 'primary',
  Completed: 'success',
  Cancelled: 'danger',
};

const STAFF_ACTIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SummaryTile({ label, value, accent }) {
  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryAccent, { backgroundColor: accent }]} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function AppointmentListScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const isStaffView = user?.role === 'admin' || user?.role === 'doctor';

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const url = user?.role === 'patient' ? '/appointments/my' : '/appointments';
      const params = {};

      if (isStaffView) {
        if (statusFilter !== 'All') {
          params.status = statusFilter;
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter.trim())) {
          params.date = dateFilter.trim();
        }
      }

      const response = await axiosInstance.get(url, { params });
      setAppointments(response.data.data || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const unsubscribe = navigation.addListener('focus', fetchAppointments);
    return unsubscribe;
  }, [navigation, user?.role, statusFilter, dateFilter]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments]
  );

  const summary = useMemo(() => {
    const today = new Date();
    const upcoming = sortedAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return appointment.status !== 'Cancelled' && appointmentDate >= today;
    });

    return {
      total: appointments.length,
      pending: appointments.filter((appointment) => appointment.status === 'Pending').length,
      upcoming: upcoming.length,
    };
  }, [appointments, sortedAppointments]);

  const handleCancel = async (appointmentId) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setUpdatingId(appointmentId);
            await axiosInstance.delete(`/appointments/${appointmentId}`);
            await fetchAppointments();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to cancel appointment');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId);
      await axiosInstance.patch(`/appointments/${appointmentId}/status`, { status });
      await fetchAppointments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update appointment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderItem = ({ item, index }) => {
    const doctorName = item.doctorId?.userId?.name || 'Unknown doctor';
    const doctorSpecialisation = item.doctorId?.specialisation || 'General Practice';
    const patientName = item.patientId?.userId?.name || 'Unknown patient';
    const actionOptions = STAFF_ACTIONS[item.status] || [];
    const isUpdating = updatingId === item._id;

    return (
      <Reveal delay={110 + index * 60}>
        <GlassCard style={styles.appointmentCard} tint={item.status === 'Cancelled' ? 'accent' : 'neutral'}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {user?.role === 'patient' ? `Dr. ${doctorName}` : patientName}
              </Text>
              <Text style={styles.cardSubtitle}>
                {user?.role === 'patient' ? doctorSpecialisation : `Doctor: ${doctorName}`}
              </Text>
            </View>
            <StatusPill label={item.status} tone={STATUS_TONES[item.status] || 'neutral'} />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{new Date(item.date).toDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{item.timeSlot}</Text>
          </View>

          {item.reason ? <Text style={styles.reasonText}>{item.reason}</Text> : null}

          {user?.role === 'patient' && item.status === 'Pending' ? (
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => handleCancel(item._id)}
              disabled={isUpdating}
            >
              <Text style={styles.secondaryActionText}>{isUpdating ? 'Cancelling...' : 'Cancel appointment'}</Text>
            </TouchableOpacity>
          ) : null}

          {(user?.role === 'admin' || user?.role === 'doctor') && actionOptions.length > 0 ? (
            <View style={styles.staffActionRow}>
              {actionOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.staffAction}
                  onPress={() => handleStatusUpdate(item._id, status)}
                  disabled={isUpdating}
                >
                  <Text style={styles.staffActionText}>{isUpdating ? 'Updating...' : status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </GlassCard>
      </Reveal>
    );
  };

  return (
    <AppScaffold scroll={false} contentContainerStyle={styles.container}>
      <FlatList
        data={sortedAppointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        onRefresh={fetchAppointments}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <>
            <Reveal delay={30}>
              <PageHeader
                eyebrow={user?.role === 'patient' ? 'Visit Schedule' : 'Care Schedule'}
                title={user?.role === 'patient'
                  ? 'A cleaner view of what is coming up next.'
                  : user?.role === 'admin'
                    ? 'Run the schedule without losing the big picture.'
                    : 'See every appointment without scanning noise.'}
                subtitle={user?.role === 'patient'
                  ? 'Track pending, confirmed, and completed visits in one place.'
                  : user?.role === 'admin'
                    ? 'Filter by status or date, then update patient visits as the day changes.'
                    : 'Review patients, update outcomes, and keep the day moving.'}
              />
            </Reveal>

            <Reveal delay={80}>
              <GlassCard style={styles.summaryCard} tint="primary">
                <View style={styles.summaryRow}>
                  <SummaryTile label="Total" value={summary.total} accent={palette.primary} />
                  <SummaryTile label="Pending" value={summary.pending} accent={palette.warning} />
                  <SummaryTile label="Upcoming" value={summary.upcoming} accent={palette.accent} />
                </View>
              </GlassCard>
            </Reveal>

            {isStaffView ? (
              <Reveal delay={95}>
                <GlassCard style={styles.filterCard}>
                  <Text style={styles.filterTitle}>Filters</Text>
                  <Text style={styles.filterSubtitle}>Use one date and one status to narrow the working queue.</Text>
                  <AppInput
                    label="Visit Date"
                    icon="calendar-month-outline"
                    placeholder="YYYY-MM-DD"
                    value={dateFilter}
                    onChangeText={setDateFilter}
                  />
                  <View style={styles.filterRow}>
                    {STATUS_FILTERS.map((filter) => (
                      <FilterChip
                        key={filter}
                        label={filter}
                        active={statusFilter === filter}
                        onPress={() => setStatusFilter(filter)}
                      />
                    ))}
                  </View>
                </GlassCard>
              </Reveal>
            ) : null}

            {user?.role === 'patient' ? (
              <Reveal delay={100}>
                <AppButton
                  label="Book a New Appointment"
                  variant="accent"
                  onPress={() => navigation.navigate('BookAppointment')}
                  style={{ marginTop: spacing.md, marginBottom: spacing.md }}
                />
              </Reveal>
            ) : null}
          </>
        )}
        ListEmptyComponent={(
          !loading ? (
            <Reveal delay={120}>
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No appointments found.</Text>
                <Text style={styles.emptyText}>
                  {user?.role === 'patient'
                    ? 'When you book your next visit, it will appear here with status updates.'
                    : 'Appointments will appear here once patients begin booking or the clinic schedule is updated.'}
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
  summaryCard: {
    marginBottom: spacing.sm,
  },
  filterCard: {
    marginBottom: spacing.md,
  },
  filterTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.ink,
  },
  filterSubtitle: {
    marginTop: 6,
    marginBottom: spacing.md,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTile: {
    flex: 1,
    paddingVertical: 6,
  },
  summaryAccent: {
    width: 26,
    height: 4,
    borderRadius: radii.pill,
    marginBottom: 14,
  },
  summaryValue: {
    fontFamily: typography.display,
    fontSize: 28,
    color: palette.ink,
  },
  summaryLabel: {
    marginTop: 6,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: palette.inkSoft,
  },
  appointmentCard: {
    marginBottom: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 21,
    color: palette.ink,
  },
  cardSubtitle: {
    marginTop: 5,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: palette.inkSoft,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(228,217,200,0.82)',
  },
  infoLabel: {
    fontFamily: typography.bodySemiBold,
    color: palette.inkSoft,
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: typography.bodyBold,
    color: palette.ink,
    fontSize: 13,
  },
  reasonText: {
    marginTop: spacing.md,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
  secondaryAction: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(198,78,59,0.1)',
  },
  secondaryActionText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.danger,
  },
  staffActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  staffAction: {
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(11,107,99,0.10)',
  },
  staffActionText: {
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
