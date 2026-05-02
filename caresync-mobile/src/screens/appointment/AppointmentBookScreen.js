import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';
import AppScaffold, { PageHeader } from '../../components/ui/AppScaffold';
import Reveal from '../../components/ui/Reveal';
import GlassCard from '../../components/ui/GlassCard';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import StatusPill from '../../components/ui/StatusPill';
import { palette, radii, spacing, typography } from '../../theme';

const formatDays = (days = []) => (days.length ? days.join(', ') : 'Flexible schedule');

function StepMarker({ number, label, active }) {
  return (
    <View style={[styles.stepMarker, active && styles.stepMarkerActive]}>
      <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{number}</Text>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

export default function AppointmentBookScreen({ navigation, route }) {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const filteredDoctors = doctors.filter((doctor) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return (
      doctor.userId?.name?.toLowerCase().includes(query)
      || doctor.specialisation?.toLowerCase().includes(query)
    );
  });

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await axiosInstance.get('/doctors');
      const doctorList = response.data.data || [];
      setDoctors(doctorList);

      if (route?.params?.doctorId) {
        const matchedDoctor = doctorList.find((doctor) => doctor._id === route.params.doctorId);
        if (matchedDoctor) {
          setSelectedDoctor(matchedDoctor);
        }
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [route?.params?.doctorId]);

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setSlots([]);
      setSelectedSlot('');
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot('');

    try {
      const response = await axiosInstance.get(`/doctors/${doctorId}/slots?date=${date}`);
      setSlots(response.data.data.availableSlots || []);
    } catch (err) {
      setSlots([]);
      Alert.alert('Error', err.response?.data?.error || 'Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot('');

    if (selectedDate) {
      fetchSlots(doctor._id, selectedDate);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      Alert.alert('Validation', 'Select a doctor, date, and time slot first.');
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.post('/appointments', {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason: reason.trim(),
      });

      setReason('');
      setSelectedSlot('');
      Alert.alert('Success', 'Appointment booked successfully.', [
        { text: 'View schedule', onPress: () => navigation.navigate('Home', { screen: 'Appointments' }) },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScaffold contentContainerStyle={styles.pageContent}>
      <Reveal delay={40}>
        <PageHeader
          eyebrow="Appointment Booking"
          title="Build the visit in three calm steps."
          subtitle="Choose the right clinician, pick a clean time slot, and confirm without second-guessing."
        />
      </Reveal>

      <Reveal delay={100}>
        <GlassCard style={styles.stepsCard} tint="primary">
          <View style={styles.stepsRow}>
            <StepMarker number="01" label="Doctor" active />
            <StepMarker number="02" label="Slot" active={!!selectedDoctor} />
            <StepMarker number="03" label="Confirm" active={!!selectedSlot} />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={150}>
        <GlassCard style={styles.searchCard}>
          <AppInput
            label="Search Care Team"
            icon="magnify"
            placeholder="Search by doctor name or specialisation"
            value={search}
            onChangeText={setSearch}
          />
        </GlassCard>
      </Reveal>

      <Reveal delay={190}>
        <PageHeader
          eyebrow="Available Doctors"
          title="Choose the best fit for this visit."
          subtitle="Review expertise, availability, and fee before moving to time selection."
        />
      </Reveal>

      {loadingDoctors ? (
        <ActivityIndicator color={palette.primary} style={{ marginVertical: 32 }} />
      ) : (
        filteredDoctors.map((doctor, index) => {
          const isSelected = selectedDoctor?._id === doctor._id;

          return (
            <Reveal key={doctor._id} delay={220 + index * 70}>
              <Pressable onPress={() => handleSelectDoctor(doctor)}>
                <GlassCard style={[styles.doctorCard, isSelected && styles.doctorCardSelected]} tint={isSelected ? 'primary' : 'neutral'}>
                  <View style={styles.doctorHeader}>
                    <View style={styles.doctorAvatar}>
                      <MaterialCommunityIcons name="stethoscope" size={22} color={palette.primaryStrong} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doctorName}>{doctor.userId?.name || 'Unknown doctor'}</Text>
                      <Text style={styles.doctorRole}>{doctor.specialisation || 'General Practice'}</Text>
                    </View>
                    {isSelected ? <StatusPill label="Selected" tone="primary" /> : <StatusPill label="Available" tone="neutral" />}
                  </View>

                  <View style={styles.doctorMetaGrid}>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="school-outline" size={16} color={palette.accent} />
                      <Text style={styles.metaChipText}>{doctor.qualification || 'Qualification on file'}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="calendar-range" size={16} color={palette.accent} />
                      <Text style={styles.metaChipText}>{formatDays(doctor.availableDays)}</Text>
                    </View>
                  </View>

                  {doctor.consultationFee ? (
                    <Text style={styles.feeText}>Consultation fee: LKR {doctor.consultationFee}</Text>
                  ) : null}
                </GlassCard>
              </Pressable>
            </Reveal>
          );
        })
      )}

      {!loadingDoctors && !filteredDoctors.length ? (
        <Reveal delay={220}>
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No doctors matched this search.</Text>
            <Text style={styles.emptyText}>Try another specialisation or clear the search field to browse all available clinicians.</Text>
          </GlassCard>
        </Reveal>
      ) : null}

      <Reveal delay={260}>
        <GlassCard style={styles.selectionCard} tint={selectedDoctor ? 'accent' : 'neutral'}>
          <Text style={styles.selectionTitle}>Visit timing</Text>
          <Text style={styles.selectionSubtitle}>
            {selectedDoctor
              ? `You're booking with ${selectedDoctor.userId?.name}. Enter a date to reveal live availability.`
              : 'Choose a doctor first, then enter a visit date in YYYY-MM-DD format.'}
          </Text>
          <View style={styles.selectionFields}>
            <AppInput
              label="Visit Date"
              icon="calendar-month-outline"
              placeholder={`YYYY-MM-DD (today: ${today})`}
              value={selectedDate}
              onChangeText={(value) => {
                setSelectedDate(value);
                if (selectedDoctor) {
                  fetchSlots(selectedDoctor._id, value);
                }
              }}
            />
            <AppInput
              label="Reason for Visit"
              icon="note-text-outline"
              placeholder="Briefly describe the reason for this visit"
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </View>
        </GlassCard>
      </Reveal>

      {loadingSlots ? <ActivityIndicator color={palette.primary} style={{ marginTop: 18 }} /> : null}

      {!loadingSlots && selectedDate && selectedDoctor ? (
        <Reveal delay={320}>
          <GlassCard style={styles.slotCard}>
            <View style={styles.slotHeading}>
              <Text style={styles.slotTitle}>Available time slots</Text>
              <StatusPill label={slots.length ? `${slots.length} open` : 'No openings'} tone={slots.length ? 'success' : 'warning'} />
            </View>
            <View style={styles.slotGrid}>
              {slots.map((slot) => (
                <Pressable
                  key={slot}
                  style={[styles.slotButton, selectedSlot === slot && styles.slotButtonActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
                </Pressable>
              ))}
            </View>
            {!slots.length ? (
              <Text style={styles.emptyText}>No slots are open for the selected day. Try another date.</Text>
            ) : null}
          </GlassCard>
        </Reveal>
      ) : null}

      <Reveal delay={360}>
        <AppButton
          label="Confirm Appointment"
          variant="accent"
          onPress={handleBook}
          loading={submitting}
          style={{ marginTop: spacing.lg }}
        />
      </Reveal>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingBottom: 156,
  },
  stepsCard: {
    marginBottom: spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepMarker: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.46)',
  },
  stepMarkerActive: {
    backgroundColor: 'rgba(11,107,99,0.12)',
  },
  stepNumber: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: palette.inkMuted,
    marginBottom: 6,
  },
  stepNumberActive: {
    color: palette.primaryStrong,
  },
  stepLabel: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.inkSoft,
  },
  stepLabelActive: {
    color: palette.ink,
  },
  searchCard: {
    marginBottom: spacing.lg,
  },
  doctorCard: {
    marginBottom: spacing.md,
  },
  doctorCardSelected: {
    borderColor: 'rgba(11,107,99,0.22)',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  doctorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,107,99,0.12)',
  },
  doctorName: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.ink,
  },
  doctorRole: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: palette.inkSoft,
    marginTop: 4,
  },
  doctorMetaGrid: {
    gap: 10,
    marginTop: spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  metaChipText: {
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: palette.inkSoft,
  },
  feeText: {
    marginTop: spacing.md,
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: palette.accent,
  },
  selectionCard: {
    marginTop: spacing.sm,
  },
  selectionTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 22,
    color: palette.ink,
  },
  selectionSubtitle: {
    marginTop: 6,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
  selectionFields: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  slotCard: {
    marginTop: spacing.lg,
  },
  slotHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  slotTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.ink,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  slotButtonActive: {
    backgroundColor: palette.primaryStrong,
    borderColor: palette.primaryStrong,
  },
  slotText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  slotTextActive: {
    color: palette.white,
  },
  emptyCard: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 20,
    color: palette.ink,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
});
