import axiosInstance from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createPrescription = async (data) => {
  const token = await AsyncStorage.getItem('token');
  console.log('Sending prescription with token:', token ? `${token.substring(0, 10)}...` : 'NONE');
  const response = await axiosInstance.post('/prescriptions', data);
  return response.data;
};

export const getPrescriptions = async () => {
  const response = await axiosInstance.get('/prescriptions');
  return response.data;
};

export const getPrescriptionById = async (id) => {
  const response = await axiosInstance.get(`/prescriptions/${id}`);
  return response.data;
};

export const getPrescriptionsByPatient = async (patientId) => {
  const response = await axiosInstance.get(`/prescriptions/patient/${patientId}`);
  return response.data;
};

export const getPrescriptionsByDoctor = async (doctorId) => {
  const response = await axiosInstance.get(`/prescriptions/doctor/${doctorId}`);
  return response.data;
};

export const updatePrescription = async (id, data) => {
  const response = await axiosInstance.put(`/prescriptions/${id}`, data);
  return response.data;
};

export const deletePrescription = async (id) => {
  const response = await axiosInstance.delete(`/prescriptions/${id}`);
  return response.data;
};
