import axiosInstance from './axiosInstance';

export const createPrescription = async (data) => {
  const response = await axiosInstance.post('/prescriptions', data);
  return response;
};

export const getPrescriptions = async () => {
  const response = await axiosInstance.get('/prescriptions');
  return response;
};

export const getPrescriptionById = async (id) => {
  const response = await axiosInstance.get(`/prescriptions/${id}`);
  return response;
};

export const getPrescriptionsByPatient = async (patientId) => {
  const response = await axiosInstance.get(`/prescriptions/patient/${patientId}`);
  return response;
};

export const getPrescriptionsByDoctor = async (doctorId) => {
  const response = await axiosInstance.get(`/prescriptions/doctor/${doctorId}`);
  return response;
};

export const updatePrescription = async (id, data) => {
  const response = await axiosInstance.put(`/prescriptions/${id}`, data);
  return response;
};

export const deletePrescription = async (id) => {
  const response = await axiosInstance.delete(`/prescriptions/${id}`);
  return response;
};
