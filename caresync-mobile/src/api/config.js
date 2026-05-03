import { Platform } from 'react-native';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = configuredBaseUrl || `http://${fallbackHost}:5004/api`;
