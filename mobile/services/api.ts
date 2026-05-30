import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Set this to your local IP address for physical devices, or 10.0.2.2 for Android Emulator
const API_URL = 'http://10.0.2.2:3000/api'; 
// const API_URL = 'http://localhost:3000/api'; // For iOS Simulator

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  getToken: async () => await SecureStore.getItemAsync('token'),
  setToken: async (token: string) => await SecureStore.setItemAsync('token', token),
  removeToken: async () => await SecureStore.deleteItemAsync('token'),
};
