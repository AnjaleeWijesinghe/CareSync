import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axiosInstance from '../../api/axiosInstance';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function PatientEditScreen({ navigation, route }) {
  const existing = route?.params?.patient;
  const [form, setForm] = useState({
    dateOfBirth: existing?.dateOfBirth ? new Date(existing.dateOfBirth).toISOString().split('T')[0] : '',
    gender: existing?.gender || '',
    phone: existing?.phone || '',
    address: existing?.address || '',
    bloodGroup: existing?.bloodGroup || '',
    allergies: existing?.allergies?.join(', ') || '',
    emergencyName: existing?.emergencyContact?.name || '',
    emergencyPhone: existing?.emergencyContact?.phone || '',
    emergencyRelation: existing?.emergencyContact?.relation || '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries({
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies.split(',').map(a => a.trim()).filter(Boolean),
        'emergencyContact[name]': form.emergencyName,
        'emergencyContact[phone]': form.emergencyPhone,
        'emergencyContact[relation]': form.emergencyRelation,
      }).forEach(([k, v]) => formData.append(k, v));

      if (photo) {
        formData.append('photo', { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' });
      }

      if (existing?._id) {
        await axiosInstance.put(`/patients/${existing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Success', 'Profile updated.');
      } else {
        await axiosInstance.post('/patients', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Success', 'Profile created.');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChange, keyboardType, placeholder }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || 'default'}
        placeholder={placeholder || label}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
        <Text style={styles.photoBtnText}>{photo ? '✓ Photo selected' : '📷 Upload Profile Photo'}</Text>
      </TouchableOpacity>

      <Field label="Date of Birth" value={form.dateOfBirth} onChange={v => update('dateOfBirth', v)} placeholder="YYYY-MM-DD" />
      <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} keyboardType="phone-pad" />
      <Field label="Address" value={form.address} onChange={v => update('address', v)} />
      <Field label="Allergies (comma separated)" value={form.allergies} onChange={v => update('allergies', v)} />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.optionRow}>
        {['Male', 'Female', 'Other'].map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.optionBtn, form.gender === g && styles.optionBtnActive]}
            onPress={() => update('gender', g)}
          >
            <Text style={[styles.optionText, form.gender === g && styles.optionTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Blood Group</Text>
      <View style={styles.optionRow}>
        {BLOOD_GROUPS.map(bg => (
          <TouchableOpacity
            key={bg}
            style={[styles.optionBtn, form.bloodGroup === bg && styles.optionBtnActive]}
            onPress={() => update('bloodGroup', bg)}
          >
            <Text style={[styles.optionText, form.bloodGroup === bg && styles.optionTextActive]}>{bg}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Emergency Contact</Text>
      <Field label="Name" value={form.emergencyName} onChange={v => update('emergencyName', v)} />
      <Field label="Phone" value={form.emergencyPhone} onChange={v => update('emergencyPhone', v)} keyboardType="phone-pad" />
      <Field label="Relation" value={form.emergencyRelation} onChange={v => update('emergencyRelation', v)} />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  photoBtn: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#2563EB', borderStyle: 'dashed' },
  photoBtnText: { color: '#2563EB', fontWeight: '600' },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB' },
  optionBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  optionText: { color: '#374151', fontSize: 13 },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 8, marginBottom: 8 },
  button: { backgroundColor: '#2563EB', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16, marginBottom: 32 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
