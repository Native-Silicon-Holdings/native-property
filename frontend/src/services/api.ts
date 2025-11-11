import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'DIRECTOR' | 'MANAGER' | 'HOMEOWNER' | 'TENANT' | 'ACCOUNTANT';
  isActive: boolean;
  emailVerified: boolean;
  property?: Property;
  createdAt: string;
  lastLogin?: string;
}

export interface Property {
  id: string;
  unitNumber: string;
  address: string;
  propertyType: 'HOUSE' | 'APARTMENT' | 'TOWNHOUSE' | 'COMMERCIAL';
  squareMeters: number;
  occupants: number;
}

// Auth API
export const authApi = {
  register: (data: any) => api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
  updateProfile: (data: any) => api.put<ApiResponse<User>>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse>('/auth/change-password', data),
};

// Document API
export const documentApi = {
  getAll: (params?: any) => api.get<ApiResponse>('/documents', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/documents/${id}`),
  upload: (formData: FormData) => api.post<ApiResponse>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: any) => api.put<ApiResponse>(`/documents/${id}`, data),
  uploadVersion: (id: string, formData: FormData) =>
    api.post<ApiResponse>(`/documents/${id}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: string) => api.delete<ApiResponse>(`/documents/${id}`),
};

// Announcement API
export const announcementApi = {
  getAll: (params?: any) => api.get<ApiResponse>('/announcements', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/announcements/${id}`),
  create: (data: any) => api.post<ApiResponse>('/announcements', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/announcements/${id}`, data),
  acknowledge: (id: string) => api.post<ApiResponse>(`/announcements/${id}/acknowledge`),
  delete: (id: string) => api.delete<ApiResponse>(`/announcements/${id}`),
};

// Utility API
export const utilityApi = {
  getReadings: (params?: any) => api.get<ApiResponse>('/utilities/readings', { params }),
  getConsumption: (propertyId: string, params?: any) =>
    api.get<ApiResponse>(`/utilities/consumption/${propertyId}`, { params }),
  addReading: (data: any) => api.post<ApiResponse>('/utilities/readings', data),
  bulkImport: (data: any) => api.post<ApiResponse>('/utilities/readings/bulk', data),
  getPayments: (params?: any) => api.get<ApiResponse>('/utilities/payments', { params }),
  recordPayment: (data: any) => api.post<ApiResponse>('/utilities/payments', data),
};

// Meeting API
export const meetingApi = {
  getAll: (params?: any) => api.get<ApiResponse>('/meetings', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/meetings/${id}`),
  create: (data: any) => api.post<ApiResponse>('/meetings', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/meetings/${id}`, data),
  rsvp: (id: string, data: any) => api.post<ApiResponse>(`/meetings/${id}/rsvp`, data),
  recordAttendance: (id: string, data: any) =>
    api.post<ApiResponse>(`/meetings/${id}/attendance`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/meetings/${id}`),
};

// Property API
export const propertyApi = {
  getAll: (params?: any) => api.get<ApiResponse>('/properties', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/properties/${id}`),
  create: (data: any) => api.post<ApiResponse>('/properties', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/properties/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/properties/${id}`),
};

// User API
export const userApi = {
  getAll: (params?: any) => api.get<ApiResponse>('/users', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/users/${id}`),
  create: (data: any) => api.post<ApiResponse>('/users', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/users/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/users/${id}`),
  getActivity: (id: string, params?: any) =>
    api.get<ApiResponse>(`/users/${id}/activity`, { params }),
};

// Maintenance API
export const maintenanceApi = {
  getAll: (params?: any) => api.get<ApiResponse>('/maintenance', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/maintenance/${id}`),
  create: (formData: FormData) => api.post<ApiResponse>('/maintenance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: any) => api.put<ApiResponse>(`/maintenance/${id}`, data),
  addFeedback: (id: string, data: any) =>
    api.post<ApiResponse>(`/maintenance/${id}/feedback`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/maintenance/${id}`),
};
