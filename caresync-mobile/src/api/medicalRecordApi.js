import axiosInstance from './axiosInstance';

export const getMyRecords = (params) => axiosInstance.get('/records/me', { params });

export const getPatientRecords = (patientId) => axiosInstance.get(`/records/patient/${patientId}`);

export const getAllRecords = (params) => axiosInstance.get('/records', { params });

export const getRecord = (id) => axiosInstance.get(`/records/${id}`);

export const searchRecords = (params) => axiosInstance.get('/records/search', { params });

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

export const createRecord = async (formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/records`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Fetch automatically sets Content-Type to multipart/form-data with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: { error: errorData.error || 'Failed to create record' }, status: response.status } };
  }
  return response.json();
};

export const updateRecord = async (id, formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/records/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: { error: errorData.error || 'Failed to update record' }, status: response.status } };
  }
  return response.json();
};

export const addAddendum = (id, text) => axiosInstance.patch(`/records/${id}/addendum`, { text });

export const archiveRecord = (id) => axiosInstance.patch(`/records/${id}/archive`);

export const deleteRecord = (id) => axiosInstance.delete(`/records/${id}`);
