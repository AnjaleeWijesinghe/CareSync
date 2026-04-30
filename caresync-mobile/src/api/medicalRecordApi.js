import axiosInstance from './axiosInstance';

export const getMyRecords = (params) => axiosInstance.get('/records/me', { params });

export const getPatientRecords = (patientId) => axiosInstance.get(`/records/patient/${patientId}`);

export const getAllRecords = (params) => axiosInstance.get('/records', { params });

export const getRecord = (id) => axiosInstance.get(`/records/${id}`);

export const searchRecords = (params) => axiosInstance.get('/records/search', { params });

export const createRecord = (formData) =>
  axiosInstance.post('/records', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });

export const updateRecord = (id, formData) =>
  axiosInstance.put(`/records/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });

export const addAddendum = (id, text) => axiosInstance.patch(`/records/${id}/addendum`, { text });

export const deleteRecord = (id) => axiosInstance.delete(`/records/${id}`);
