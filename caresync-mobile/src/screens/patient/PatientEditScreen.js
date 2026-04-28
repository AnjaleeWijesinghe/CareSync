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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];

function ChoiceChip({ label, active, onPress }) {
  return (
    <Pressable style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function PatientEditScreen({ navigation, route }) {
  const { user } = useAuth();
  const existing = route?.params?.patient;
  const isAdmin = user?.role === 'admin';
  const isAdminCreate = isAdmin && !existing?._id;
  const [form, setForm] = useState({
    name: existing?.userId?.name || '',
    email: existing?.userId?.email || '',
    password: '',
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

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const currentPhotoUri = photo?.uri || existing?.photoUrl || null;

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
    if (isAdmin) {
      if (!form.name.trim() || !form.email.trim()) {
        Alert.alert('Validation', 'Name and email are required.');
        return;
      }

      if (isAdminCreate && form.password.length < 6) {
        Alert.alert('Validation', 'Temporary password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const fields = {
        name: form.name,
        email: form.email,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies,
        emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone,
        emergencyRelation: form.emergencyRelation,
      };

      if (isAdminCreate) {
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

  return (
    <AppScaffold>
      <Reveal delay={30}>
        <PageHeader
          eyebrow={isAdmin ? (existing ? 'Patient Update' : 'Patient Creation') : (existing ? 'Profile Refresh' : 'Profile Creation')}
          title={isAdmin
            ? (existing ? 'Update the patient account without leaving the care workflow.' : 'Create a patient account that is ready for booking.')
            : (existing ? 'Refine the details patients rely on.' : 'Build a profile that is complete before the next visit.')}
          subtitle={isAdmin
            ? 'Set the account identity, contact details, and emergency context in one place.'
            : 'Keep contact, emergency, and care identity details consistent so appointments stay friction-free.'}
        />
      </Reveal>

      <Reveal delay={90}>
        <GlassCard style={styles.photoCard} tint="primary">
          <View style={styles.photoRow}>
            {currentPhotoUri ? (
              <Image source={{ uri: currentPhotoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPreviewPlaceholder}>
                <MaterialCommunityIcons name="account-outline" size={34} color={palette.primaryStrong} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.photoTitle}>Profile photo</Text>
              <Text style={styles.photoText}>A recognisable image makes staff-side identification quicker during busy schedules.</Text>
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
          <Text style={styles.sectionTitle}>{isAdmin ? 'Account and profile details' : 'Core details'}</Text>
          <View style={styles.fieldStack}>
            {isAdmin ? (
              <>
                <AppInput
                  label="Patient Name"
                  icon="account-outline"
                  placeholder="Full patient name"
                  value={form.name}
                  onChangeText={(value) => update('name', value)}
                  autoCapitalize="words"
                />
                <AppInput
                  label="Email Address"
                  icon="email-outline"
                  placeholder="patient@domain.com"
                  value={form.email}
                  onChangeText={(value) => update('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {isAdminCreate ? (
                  <AppInput
                    label="Temporary Password"
                    icon="lock-outline"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChangeText={(value) => update('password', value)}
                    secureTextEntry
                  />
                ) : null}
              </>
            ) : null}
            <AppInput
              label="Date of Birth"
              icon="calendar-month-outline"
              placeholder="YYYY-MM-DD"
              value={form.dateOfBirth}
              onChangeText={(value) => update('dateOfBirth', value)}
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
              label="Address"
              icon="map-marker-outline"
              placeholder="Home address"
              value={form.address}
              onChangeText={(value) => update('address', value)}
              multiline
            />
            <AppInput
              label="Allergies"
              icon="pill"
              placeholder="Comma separated allergies"
              value={form.allergies}
              onChangeText={(value) => update('allergies', value)}
              multiline
            />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={190}>
        <GlassCard style={styles.sectionCard} tint="accent">
          <Text style={styles.sectionTitle}>Profile tags</Text>
          <Text style={styles.sectionSubtitle}>Choose the identifiers that matter most during fast triage and scheduling.</Text>

          <Text style={styles.groupLabel}>Gender</Text>
          <View style={styles.choiceRow}>
            {GENDERS.map((gender) => (
              <ChoiceChip
                key={gender}
                label={gender}
                active={form.gender === gender}
                onPress={() => update('gender', gender)}
              />
            ))}
          </View>

          <Text style={styles.groupLabel}>Blood Group</Text>
          <View style={styles.choiceRow}>
            {BLOOD_GROUPS.map((bloodGroup) => (
              <ChoiceChip
                key={bloodGroup}
                label={bloodGroup}
                active={form.bloodGroup === bloodGroup}
                onPress={() => update('bloodGroup', bloodGroup)}
              />
            ))}
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={240}>
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Emergency contact</Text>
          <View style={styles.fieldStack}>
            <AppInput
              label="Name"
              icon="account-heart-outline"
              placeholder="Emergency contact name"
              value={form.emergencyName}
              onChangeText={(value) => update('emergencyName', value)}
            />
            <AppInput
              label="Phone"
              icon="phone-alert-outline"
              placeholder="Emergency phone number"
              value={form.emergencyPhone}
              onChangeText={(value) => update('emergencyPhone', value)}
              keyboardType="phone-pad"
            />
            <AppInput
              label="Relation"
              icon="family-tree"
              placeholder="Relation to patient"
              value={form.emergencyRelation}
              onChangeText={(value) => update('emergencyRelation', value)}
            />
          </View>
        </GlassCard>
      </Reveal>

      <Reveal delay={290}>
        <AppButton
          label={isAdmin
            ? (existing ? 'Save Patient Changes' : 'Create Patient Account')
            : (existing ? 'Save Profile Changes' : 'Create Patient Profile')}
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
