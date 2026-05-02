import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import AppScaffold, { PageHeader } from '../../components/ui/AppScaffold';
import Reveal from '../../components/ui/Reveal';
import GlassCard from '../../components/ui/GlassCard';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import { palette, radii, spacing, typography } from '../../theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ChoiceChip({ label, active, onPress }) {
  return (
    <Pressable style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function DoctorEditScreen({ navigation, route }) {
  const { user } = useAuth();
  const existing = route?.params?.doctor;
  const isAdmin = user?.role === 'admin';
  const isAdminCreate = isAdmin && !existing?._id;
  const [form, setForm] = useState({
    name: existing?.userId?.name || '',
    email: existing?.userId?.email || '',
    password: '',
    specialisation: existing?.specialisation || '',
    qualification: existing?.qualification || '',
    experienceYears: existing?.experienceYears !== undefined && existing?.experienceYears !== null ? String(existing.experienceYears) : '',
    phone: existing?.phone || '',
    consultationFee: existing?.consultationFee !== undefined && existing?.consultationFee !== null ? String(existing.consultationFee) : '',
    availableSlots: existing?.availableSlots?.join(', ') || '',
    availableDays: existing?.availableDays || [],
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const currentPhotoUri = photo?.uri || existing?.photoUrl || null;

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      availableDays: current.availableDays.includes(day)
        ? current.availableDays.filter((entry) => entry !== day)
        : [...current.availableDays, day],
    }));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.specialisation.trim()) {
      Alert.alert('Validation', 'Name, email, and specialisation are required.');
      return;
    }

    if (isAdminCreate && form.password.length < 6) {
      Alert.alert('Validation', 'Temporary password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const fields = {
        name: form.name,
        email: form.email,
        specialisation: form.specialisation,
        qualification: form.qualification,
        experienceYears: form.experienceYears,
        phone: form.phone,
        consultationFee: form.consultationFee,
        availableSlots: form.availableSlots,
        availableDays: form.availableDays.join(','),
      };

      if (isAdmin && form.password) {
        fields.password = form.password;
      }

      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      if (photo) {
        formData.append('photo', { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' });
      }

      if (existing?._id) {
        await axiosInstance.put(`/doctors/${existing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Success', 'Doctor profile updated.');
      } else {
        await axiosInstance.post('/doctors', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Success', 'Doctor account created.');
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save doctor profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScaffold>
      <Reveal delay={30}>
        <PageHeader
          eyebrow={isAdmin ? (existing ? 'Doctor Update' : 'Doctor Creation') : 'Practice Profile'}
          title={isAdmin
            ? (existing ? 'Update the doctor account without breaking the schedule.' : 'Create a doctor account that is ready for booking.')
            : 'Refine the practice profile patients will see first.'}
          subtitle={isAdmin
            ? 'Set identity, clinical details, fee, and availability in one structured flow.'
            : 'Keep your visible schedule, fee, and profile details aligned with the current clinic reality.'}
        />
      </Reveal>

      <Reveal delay={90}>
        <GlassCard style={styles.photoCard} tint="primary">
          <View style={styles.photoRow}>
            {currentPhotoUri ? (
              <Image source={{ uri: currentPhotoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPreviewPlaceholder}>
                <MaterialCommunityIcons name="stethoscope" size={34} color={palette.primaryStrong} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.photoTitle}>Doctor photo</Text>
              <Text style={styles.photoText}>A clear doctor image increases trust and makes the list easier to scan.</Text>
            </View>
          </View>
          <AppButton
            label={currentPhotoUri ? 'Replace Photo' : 'Upload Photo'}
            variant="ghost"
            onPress={pickPhoto}
            leftIcon={<MaterialCommunityIcons name="image-outline" size={18} color={palette.ink} />}
            textStyle={{ color: palette.ink }}
            style={{ marginTop: spacing.md }}
          />
        </GlassCard>
      </Reveal>

      <Reveal delay={140}>
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account and practice details</Text>
          <View style={styles.fieldStack}>
            <AppInput
              label="Doctor Name"
              icon="account-outline"
              placeholder="Full doctor name"
              value={form.name}
              onChangeText={(value) => update('name', value)}
              autoCapitalize="words"
            />
            <AppInput
              label="Email Address"
              icon="email-outline"
              placeholder="doctor@domain.com"
              value={form.email}
              onChangeText={(value) => update('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {isAdmin ? (
              <AppInput
                label={isAdminCreate ? 'Temporary Password' : 'Reset Password (optional)'}
                icon="lock-outline"
                placeholder={isAdminCreate ? 'Minimum 6 characters' : 'Leave blank to keep current password'}
                value={form.password}
                onChangeText={(value) => update('password', value)}
                secureTextEntry
              />
            ) : null}
            <AppInput
              label="Specialisation"
              icon="stethoscope"
              placeholder="Cardiology, Pediatrics, General Practice..."
              value={form.specialisation}
              onChangeText={(value) => update('specialisation', value)}
            />
            <AppInput
              label="Qualification"
              icon="school-outline"
              placeholder="MBBS, MD..."
              value={form.qualification}
              onChangeText={(value) => update('qualification', value)}
            />
            <AppInput
              label="Experience Years"
              icon="medal-outline"
              placeholder="Years of practice"
              value={form.experienceYears}
              onChangeText={(value) => update('experienceYears', value)}
              keyboardType="number-pad"
            />
            <AppInput
              label="Phone"
              icon="phone-outline"
              placeholder="Contact number"
              value={form.phone}
              onChangeText={(value) => update('phone', value)}
              keyboardType="phone-pad"
            />
            <AppInput
              label="Consultation Fee"
              icon="cash-multiple"
              placeholder="Fee in LKR"
              value={form.consultationFee}
              onChangeText={(value) => update('consultationFee', value)}
              keyboardType="number-pad"
            />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={190}>
        <GlassCard style={styles.sectionCard} tint="accent">
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.sectionSubtitle}>Set the weekly pattern patients can trust when they choose a slot.</Text>

          <Text style={styles.groupLabel}>Working Days</Text>
          <View style={styles.choiceRow}>
            {DAYS.map((day) => (
              <ChoiceChip
                key={day}
                label={day}
                active={form.availableDays.includes(day)}
                onPress={() => toggleDay(day)}
              />
            ))}
          </View>

          <View style={styles.fieldStack}>
            <AppInput
              label="Available Slots"
              icon="clock-outline"
              placeholder="09:00 AM, 10:30 AM, 02:00 PM"
              value={form.availableSlots}
              onChangeText={(value) => update('availableSlots', value)}
              multiline
            />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={240}>
        <AppButton
          label={isAdmin
            ? (existing ? 'Save Doctor Changes' : 'Create Doctor Account')
            : 'Save My Profile'}
          onPress={handleSave}
          loading={loading}
          leftIcon={!loading ? <MaterialCommunityIcons name="content-save-outline" size={18} color={palette.white} /> : null}
          style={{ marginTop: spacing.sm }}
        />
      </Reveal>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  photoCard: {
    marginBottom: spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoPreview: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  photoPreviewPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,107,99,0.12)',
  },
  photoTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 22,
    color: palette.ink,
    marginBottom: 6,
  },
  photoText: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.displayMedium,
    fontSize: 22,
    color: palette.ink,
  },
  sectionSubtitle: {
    marginTop: 6,
    marginBottom: spacing.md,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.inkSoft,
  },
  fieldStack: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  groupLabel: {
    marginTop: spacing.md,
    marginBottom: 10,
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  choiceChipActive: {
    backgroundColor: palette.primaryStrong,
    borderColor: palette.primaryStrong,
  },
  choiceChipText: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  choiceChipTextActive: {
    color: palette.white,
  },
});
