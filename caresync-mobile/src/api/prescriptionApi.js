import axiosInstance from './axiosInstance';

export const getMyPrescriptions = () => axiosInstance.get('/prescriptions/my');

export const getAllPrescriptions = (params) => axiosInstance.get('/prescriptions', { params });

export const getPrescription = (id) => axiosInstance.get(`/prescriptions/${id}`);

export const createPrescription = (data) => axiosInstance.post('/prescriptions', data);

export const updatePrescription = (id, data) => axiosInstance.put(`/prescriptions/${id}`, data);

export const refillPrescription = (id) => axiosInstance.patch(`/prescriptions/${id}/refill`);

export const deletePrescription = (id) => axiosInstance.delete(`/prescriptions/${id}`);
