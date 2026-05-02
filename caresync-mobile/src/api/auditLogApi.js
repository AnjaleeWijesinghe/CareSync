import axiosInstance from './axiosInstance';

export const getAuditLogs = (params) => axiosInstance.get('/audit-logs', { params });

export const getRecordAuditTrail = (recordId) => axiosInstance.get(`/audit-logs/record/${recordId}`);
