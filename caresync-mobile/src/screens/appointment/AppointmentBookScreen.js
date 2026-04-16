import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import axiosInstance from '../../api/axiosInstance';

export default function AppointmentBookScreen({ navigation, route }) {
  const { doctorId, doctorName } = route.params;
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchSlots = async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    try {
      const res = await axiosInstance.get(`/doctors/${doctorId}/slots?date=${date}`);
      setSlots(res.data.data.availableSlots || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      Alert.alert('Validation', 'Please select a date and time slot.');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/appointments', {
        doctorId,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason,
      });
      Alert.alert('Success', 'Appointment booked!', [
        { text: 'OK', onPress: () => navigation.navigate('Appointments') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.doctorName}>Booking with Dr. {doctorName}</Text>

      <Text style={styles.label}>Select Date</Text>
      <TextInput
        style={styles.input}
        value={selectedDate}
        onChangeText={(val) => {
          setSelectedDate(val);
          if (/^\d{4}-\d{2}-\d{2}$/.test(val)) fetchSlots(val);
        }}
        placeholder={`YYYY-MM-DD (today: ${today})`}
      />

      {loadingSlots && <ActivityIndicator color="#2563EB" style={{ marginVertical: 8 }} />}

      {slots.length > 0 && (
        <>
          <Text style={styles.label}>Select Time Slot</Text>
          <View style={styles.slotGrid}>
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {slots.length === 0 && selectedDate && !loadingSlots && (
        <Text style={styles.noSlots}>No available slots for this date.</Text>
      )}

      <Text style={styles.label}>Reason for Visit (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={reason}
        onChangeText={setReason}
        placeholder="Describe your symptoms or reason..."
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.button} onPress={handleBook} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Booking</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  doctorName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 },
  label: { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
  slotBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  slotText: { color: '#374151', fontSize: 13 },
  slotTextActive: { color: '#fff', fontWeight: '600' },
  noSlots: { color: '#EF4444', marginTop: 8, fontSize: 14 },
  button: { backgroundColor: '#2563EB', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 32 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
