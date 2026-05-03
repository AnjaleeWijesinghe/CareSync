import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createPrescription } from '../../api/prescriptionApi';
import { useAuth } from '../../context/AuthContext';

const CreatePrescriptionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    recordId: '',
    patientId: '', 
    notes: '',
  });

  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  const addMedication = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedication = (index) => {
    const list = [...medicines];
    list.splice(index, 1);
    setMedicines(list);
  };

  const handleMedicationChange = (index, field, value) => {
    const list = [...medicines];
    list[index][field] = value;
    setMedicines(list);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.recordId || !formData.patientId) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const data = { ...formData, medicines };
      await createPrescription(data);
      Alert.alert('Success', 'Prescription created successfully');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || 
                     error.response?.data?.errors?.[0]?.msg || 
                     'Failed to create prescription';
      Alert.alert('Error', errMsg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Text style={styles.headerTitle}>New Prescription</Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.label}>Medical Record ID *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Medical Record ID"
          value={formData.recordId}
          onChangeText={(val) => setFormData({ ...formData, recordId: val })}
        />

        <Text style={styles.label}>Patient ID *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter patient ID"
          value={formData.patientId}
          onChangeText={(val) => setFormData({ ...formData, patientId: val })}
        />

        <Text style={styles.sectionTitle}>Medicines</Text>
        {medicines.map((med, index) => (
          <View key={index} style={styles.medicationCard}>
            <View style={styles.medHeader}>
              <Text style={styles.medIndex}>Medicine #{index + 1}</Text>
              {medicines.length > 1 && (
                <TouchableOpacity onPress={() => removeMedication(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Medicine Name"
              value={med.name}
              onChangeText={(val) => handleMedicationChange(index, 'name', val)}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 5 }]}
                placeholder="Dosage"
                value={med.dosage}
                onChangeText={(val) => handleMedicationChange(index, 'dosage', val)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Frequency"
                value={med.frequency}
                onChangeText={(val) => handleMedicationChange(index, 'frequency', val)}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Duration (e.g. 7 days)"
              value={med.duration}
              onChangeText={(val) => handleMedicationChange(index, 'duration', val)}
            />
            <TextInput
              style={styles.input}
              placeholder="Instructions"
              value={med.instructions}
              onChangeText={(val) => handleMedicationChange(index, 'instructions', val)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addMedication}>
          <Text style={styles.addButtonText}>+ Add Medicine</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional notes"
          multiline
          numberOfLines={3}
          value={formData.notes}
          onChangeText={(val) => setFormData({ ...formData, notes: val })}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Prescription</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 30, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 15, color: '#192f6a' },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    fontSize: 16
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  medicationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2
  },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  medIndex: { fontWeight: 'bold', color: '#3b5998' },
  removeText: { color: '#d32f2f', fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  addButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b5998',
    alignItems: 'center',
    marginBottom: 20
  },
  addButtonText: { color: '#3b5998', fontWeight: 'bold' },
  submitButton: {
    backgroundColor: '#192f6a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default CreatePrescriptionScreen;
