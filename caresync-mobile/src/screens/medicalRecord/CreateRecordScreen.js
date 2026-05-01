import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { createRecord, getRecord, updateRecord } from '../../api/medicalRecordApi';
import axiosInstance from '../../api/axiosInstance';
import { palette, radii, shadows, spacing, typography } from '../../theme';

export default function CreateRecordScreen({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const preselectedPatientId = route?.params?.patientId;
  const editRecordId = route?.params?.editRecordId;

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientPicker, setShowPatientPicker] = useState(!preselectedPatientId && !editRecordId);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Load patient list for selection
  const searchPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const params = patientSearch.trim() ? { name: patientSearch.trim() } : {};
      const res = await axiosInstance.get('/patients', { params });
      setPatients(res?.data?.data || []);
    } catch { setPatients([]); }
    finally { setLoadingPatients(false); }
  }, [patientSearch]);

  useEffect(() => {
    if (!preselectedPatientId) searchPatients();
  }, [searchPatients, preselectedPatientId]);

  useEffect(() => {
    if (user?.role === 'admin' && !editRecordId) {
      setLoadingDoctors(true);
      axiosInstance.get('/appointments/doctors')
        .then(res => setDoctors(res?.data?.data || []))
        .catch(() => {})
        .finally(() => setLoadingDoctors(false));
    }
  }, [user?.role, editRecordId]);

  useEffect(() => {
    if (preselectedPatientId) {
      axiosInstance.get(`/patients/${preselectedPatientId}`).then((res) => {
        if (res?.data?.data) setSelectedPatient(res.data.data);
      }).catch(() => {});
    }
  }, [preselectedPatientId]);

  useEffect(() => {
    if (editRecordId) {
      getRecord(editRecordId).then((res) => {
        const data = res?.data?.data;
        if (data) {
          if (data.patientId) setSelectedPatient(data.patientId);
          setDiagnosis(data.diagnosis || '');
          setSymptoms(data.symptoms?.join(', ') || '');
          setTreatment(data.treatment || '');
          setNotes(data.notes || '');
          if (data.vitalSigns) {
            setBp(data.vitalSigns.bloodPressure || '');
            setHr(data.vitalSigns.heartRate ? String(data.vitalSigns.heartRate) : '');
            setTemp(data.vitalSigns.temperature ? String(data.vitalSigns.temperature) : '');
            setWeight(data.vitalSigns.weight ? String(data.vitalSigns.weight) : '');
            setHeight(data.vitalSigns.height ? String(data.vitalSigns.height) : '');
          }
        }
      }).catch(() => Alert.alert('Error', 'Failed to load record for editing'));
    }
  }, [editRecordId]);

  const validate = () => {
    const e = {};
    if (!selectedPatient && !preselectedPatientId && !editRecordId) e.patient = 'Select a patient';
    if (user?.role === 'admin' && !editRecordId && !selectedDoctor) e.doctor = 'Select a doctor';
    if (!diagnosis.trim()) e.diagnosis = 'Diagnosis is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        multiple: true, copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        setFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) { Alert.alert('Error', 'Could not pick document'); }
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('patientId', selectedPatient?._id || preselectedPatientId);
      if (user?.role === 'admin' && selectedDoctor) {
        form.append('doctorId', selectedDoctor._id);
      }
      form.append('diagnosis', diagnosis.trim());
      if (symptoms.trim()) form.append('symptoms', symptoms.trim());
      if (treatment.trim()) form.append('treatment', treatment.trim());
      if (notes.trim()) form.append('notes', notes.trim());

      const vitals = {};
      if (bp.trim()) vitals.bloodPressure = bp.trim();
      if (hr.trim()) vitals.heartRate = hr.trim();
      if (temp.trim()) vitals.temperature = temp.trim();
      if (weight.trim()) vitals.weight = weight.trim();
      if (height.trim()) vitals.height = height.trim();
      if (Object.keys(vitals).length) form.append('vitalSigns', JSON.stringify(vitals));

      for (const file of files) {
        form.append('documents', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      }

      if (editRecordId) {
        await updateRecord(editRecordId, form);
        Alert.alert('Success', 'Medical record updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createRecord(form);
        Alert.alert('Success', 'Medical record created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient Selection */}
        <Text style={styles.sectionLabel}>Patient *</Text>
        {selectedPatient ? (
          <View style={styles.selectedPatient}>
            <View style={styles.selectedInfo}>
              <MaterialCommunityIcons name="account-circle" size={28} color={palette.primary} />
              <View>
                <Text style={styles.selectedName}>{selectedPatient.userId?.name || 'Patient'}</Text>
                <Text style={styles.selectedEmail}>{selectedPatient.userId?.email || ''}</Text>
              </View>
            </View>
            {(!preselectedPatientId && !editRecordId) && (
              <TouchableOpacity onPress={() => { setSelectedPatient(null); setShowPatientPicker(true); }}>
                <MaterialCommunityIcons name="close-circle" size={22} color={palette.inkMuted} />
              </TouchableOpacity>
            )}
          </View>
        ) : showPatientPicker ? (
          <View style={styles.pickerWrap}>
            <TextInput style={styles.pickerInput} placeholder="Search patients by name…"
              placeholderTextColor={palette.inkMuted} value={patientSearch}
              onChangeText={setPatientSearch} onSubmitEditing={searchPatients} />
            {loadingPatients ? <ActivityIndicator color={palette.primary} style={{ marginVertical: 8 }} /> : (
              patients.slice(0, 5).map((p) => (
                <TouchableOpacity key={p._id} style={styles.pickerItem}
                  onPress={() => { setSelectedPatient(p); setShowPatientPicker(false); }}>
                  <Text style={styles.pickerName}>{p.userId?.name || 'Unknown'}</Text>
                  <Text style={styles.pickerEmail}>{p.userId?.email || ''}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : null}
        {errors.patient && <Text style={styles.error}>{errors.patient}</Text>}

        {/* Doctor Selection for Admin */}
        {user?.role === 'admin' && !editRecordId && (
          <>
            <Text style={styles.sectionLabel}>Doctor *</Text>
            {selectedDoctor ? (
              <View style={styles.selectedPatient}>
                <View style={styles.selectedInfo}>
                  <MaterialCommunityIcons name="stethoscope" size={28} color={palette.primary} />
                  <View>
                    <Text style={styles.selectedName}>{selectedDoctor.userId?.name || 'Doctor'}</Text>
                    <Text style={styles.selectedEmail}>{selectedDoctor.specialisation || ''}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedDoctor(null)}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={palette.inkMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickerWrap}>
                {loadingDoctors ? <ActivityIndicator color={palette.primary} style={{ marginVertical: 8 }} /> : (
                  doctors.map((d) => (
                    <TouchableOpacity key={d._id} style={styles.pickerItem} onPress={() => setSelectedDoctor(d)}>
                      <Text style={styles.pickerName}>{d.userId?.name || 'Unknown'}</Text>
                      <Text style={styles.pickerEmail}>{d.specialisation || ''}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
            {errors.doctor && <Text style={styles.error}>{errors.doctor}</Text>}
          </>
        )}

        {/* Diagnosis */}
        <Text style={styles.sectionLabel}>Diagnosis *</Text>
        <TextInput style={[styles.input, errors.diagnosis && styles.inputError]}
          placeholder="Enter diagnosis" placeholderTextColor={palette.inkMuted}
          value={diagnosis} onChangeText={(t) => { setDiagnosis(t); if (errors.diagnosis) setErrors((e) => ({ ...e, diagnosis: null })); }} />
        {errors.diagnosis && <Text style={styles.error}>{errors.diagnosis}</Text>}

        {/* Symptoms */}
        <Text style={styles.sectionLabel}>Symptoms</Text>
        <TextInput style={styles.input} placeholder="Comma-separated (e.g. Fever, Cough)"
          placeholderTextColor={palette.inkMuted} value={symptoms} onChangeText={setSymptoms} />

        {/* Treatment */}
        <Text style={styles.sectionLabel}>Treatment</Text>
        <TextInput style={[styles.input, styles.multiline]} placeholder="Treatment plan"
          placeholderTextColor={palette.inkMuted} value={treatment} onChangeText={setTreatment}
          multiline numberOfLines={3} />

        {/* Clinical Notes */}
        <Text style={styles.sectionLabel}>Clinical Notes</Text>
        <TextInput style={[styles.input, styles.multiline]} placeholder="Additional notes"
          placeholderTextColor={palette.inkMuted} value={notes} onChangeText={setNotes}
          multiline numberOfLines={3} />

        {/* Vital Signs */}
        <Text style={styles.sectionLabel}>Vital Signs</Text>
        <View style={styles.vitalsRow}>
          <View style={styles.vitalInput}>
            <Text style={styles.vitalLabel}>BP</Text>
            <TextInput style={styles.vitalField} placeholder="120/80" placeholderTextColor={palette.inkMuted} value={bp} onChangeText={setBp} />
          </View>
          <View style={styles.vitalInput}>
            <Text style={styles.vitalLabel}>HR</Text>
            <TextInput style={styles.vitalField} placeholder="72" placeholderTextColor={palette.inkMuted} value={hr} onChangeText={setHr} keyboardType="numeric" />
          </View>
          <View style={styles.vitalInput}>
            <Text style={styles.vitalLabel}>Temp°C</Text>
            <TextInput style={styles.vitalField} placeholder="37.0" placeholderTextColor={palette.inkMuted} value={temp} onChangeText={setTemp} keyboardType="decimal-pad" />
          </View>
        </View>
        <View style={styles.vitalsRow}>
          <View style={styles.vitalInput}>
            <Text style={styles.vitalLabel}>Weight (kg)</Text>
            <TextInput style={styles.vitalField} placeholder="70" placeholderTextColor={palette.inkMuted} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
          </View>
          <View style={styles.vitalInput}>
            <Text style={styles.vitalLabel}>Height (cm)</Text>
            <TextInput style={styles.vitalField} placeholder="175" placeholderTextColor={palette.inkMuted} value={height} onChangeText={setHeight} keyboardType="numeric" />
          </View>
        </View>

        {/* Documents */}
        <Text style={styles.sectionLabel}>Documents</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
          <MaterialCommunityIcons name="cloud-upload-outline" size={22} color={palette.primary} />
          <Text style={styles.uploadText}>Attach Lab Reports / Images</Text>
        </TouchableOpacity>
        {files.map((f, i) => (
          <View key={i} style={styles.fileRow}>
            <MaterialCommunityIcons name={f.mimeType?.includes('pdf') ? 'file-pdf-box' : 'file-image'} size={20} color={palette.primary} />
            <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
            <TouchableOpacity onPress={() => removeFile(i)}>
              <MaterialCommunityIcons name="close-circle" size={18} color={palette.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Submit */}
        <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
          {submitting ? <ActivityIndicator color={palette.white} /> : (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.white} />
              <Text style={styles.submitText}>{editRecordId ? 'Update Medical Record' : 'Create Medical Record'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: palette.canvasBottom },
  content: { padding: spacing.md },
  sectionLabel: { fontFamily: typography.bodySemiBold, fontSize: 13, color: palette.inkSoft, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: palette.paper, borderRadius: radii.sm, padding: spacing.sm, fontFamily: typography.body,
    fontSize: 14, color: palette.ink, borderWidth: 1, borderColor: palette.line,
  },
  inputError: { borderColor: palette.danger },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { fontFamily: typography.body, fontSize: 12, color: palette.danger, marginTop: 4 },
  selectedPatient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.primarySoft, borderRadius: radii.sm, padding: spacing.sm },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectedName: { fontFamily: typography.bodySemiBold, fontSize: 14, color: palette.ink },
  selectedEmail: { fontFamily: typography.body, fontSize: 12, color: palette.inkMuted },
  pickerWrap: { backgroundColor: palette.paper, borderRadius: radii.sm, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' },
  pickerInput: { padding: spacing.sm, fontFamily: typography.body, fontSize: 14, color: palette.ink, borderBottomWidth: 1, borderBottomColor: palette.line },
  pickerItem: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: palette.line },
  pickerName: { fontFamily: typography.bodyMedium, fontSize: 14, color: palette.ink },
  pickerEmail: { fontFamily: typography.body, fontSize: 12, color: palette.inkMuted },
  vitalsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  vitalInput: { flex: 1 },
  vitalLabel: { fontFamily: typography.body, fontSize: 11, color: palette.inkMuted, marginBottom: 3 },
  vitalField: { backgroundColor: palette.paper, borderRadius: radii.sm, padding: spacing.xs, fontFamily: typography.body, fontSize: 14, color: palette.ink, borderWidth: 1, borderColor: palette.line, textAlign: 'center' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: palette.paper,
    borderRadius: radii.sm, borderWidth: 1, borderColor: palette.line, borderStyle: 'dashed',
  },
  uploadText: { fontFamily: typography.bodyMedium, fontSize: 14, color: palette.primary },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: palette.paperMuted, borderRadius: radii.sm, marginTop: spacing.xs },
  fileName: { flex: 1, fontFamily: typography.body, fontSize: 13, color: palette.ink },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: palette.primary, borderRadius: radii.sm, padding: spacing.md, marginTop: spacing.lg,
  },
  submitText: { fontFamily: typography.bodySemiBold, fontSize: 15, color: palette.white },
  disabled: { opacity: 0.5 },
});
