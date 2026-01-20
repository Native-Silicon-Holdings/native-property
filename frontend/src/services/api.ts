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

// Response interceptor to handle errors and refresh tokens
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        processQueue(error, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { token } = response.data.data;
        localStorage.setItem('token', token);
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
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
  register: (data: any) => api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>('/auth/login', data),
  refresh: (data: { refreshToken: string }) => api.post<ApiResponse<{ token: string }>>('/auth/refresh', data),
  logout: (data?: { refreshToken?: string }) => api.post<ApiResponse>('/auth/logout', data),
  getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/profile'),
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
  getBilling: (propertyId: string) => api.get<ApiResponse>(`/utilities/billing/${propertyId}`),
};

// Meeting API
export const meetingApi = {
  getAll: (params?: any) => api.get<ApiResponse>('/meetings', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/meetings/${id}`),
  create: (data: any) => api.post<ApiResponse>('/meetings', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/meetings/${id}`, data),
  rsvp: (id: string, data: any) => api.post<ApiResponse>(`/meetings/${id}/rsvp`, data),
  getAttendance: (meetingId: string) => api.get<ApiResponse>(`/meetings/${meetingId}/attendance`),
  recordAttendance: (id: string, data: any) =>
    api.post<ApiResponse>(`/meetings/${id}/attendance`, data),
  recordUserAttendance: (meetingId: string, userId: string, data: any) =>
    api.put<ApiResponse>(`/meetings/${meetingId}/attendance/${userId}`, data),
  createResolution: (meetingId: string, data: any) => api.post<ApiResponse>(`/meetings/${meetingId}/resolutions`, data),
  voteOnResolution: (resolutionId: string, data: any) => api.post<ApiResponse>(`/meetings/resolutions/${resolutionId}/vote`, data),
  getResolutionResults: (resolutionId: string) => api.get<ApiResponse>(`/meetings/resolutions/${resolutionId}/results`),
  delete: (id: string) => api.delete<ApiResponse>(`/meetings/${id}`),
};

// Property API
export const propertyApi = {
  getMyProperties: () => api.get<ApiResponse>('/properties/my-properties'),
  getAll: (params?: any) => api.get<ApiResponse>('/properties', { params }),
  getById: (id: string) => api.get<ApiResponse>(`/properties/${id}`),
  getHistory: (id: string, params?: any) => api.get<ApiResponse>(`/properties/${id}/history`, { params }),
  getOwners: (id: string) => api.get<ApiResponse>(`/properties/${id}/owners`),
  getAccessRequests: (id: string) => api.get<ApiResponse>(`/properties/${id}/access-requests`),
  create: (data: any) => api.post<ApiResponse>('/properties', data),
  initiateTransfer: (id: string, data: any) => api.post<ApiResponse>(`/properties/${id}/transfer`, data),
  approveAccessRequest: (requestId: string, data: any) => api.put<ApiResponse>(`/properties/access-requests/${requestId}/approve`, data),
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
  getStats: () => api.get<ApiResponse>('/maintenance/stats'),
  delete: (id: string) => api.delete<ApiResponse>(`/maintenance/${id}`),
};

// Financial API
export const financialApi = {
  getOverview: (params?: any) => api.get<ApiResponse>('/financial/overview', { params }),
  createTransaction: (data: any) => api.post<ApiResponse>('/financial/transactions', data),
  getBudget: (params?: any) => api.get<ApiResponse>('/financial/budget', { params }),
  createBudget: (data: any) => api.post<ApiResponse>('/financial/budget', data),
  updateBudget: (id: string, data: any) => api.put<ApiResponse>(`/financial/budget/${id}`, data),
};

// Director API
export const directorApi = {
  getAll: () => api.get<ApiResponse>('/directors'),
  getActive: () => api.get<ApiResponse>('/directors/active'),
  getExpiring: () => api.get<ApiResponse>('/directors/expiring'),
  getByPosition: (position: string) => api.get<ApiResponse>(`/directors/position/${position}`),
  getById: (id: string) => api.get<ApiResponse>(`/directors/${id}`),
  create: (data: any) => api.post<ApiResponse>('/directors', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/directors/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/directors/${id}`),
};

// Election API
export const electionApi = {
  getAll: () => api.get<ApiResponse>('/elections'),
  getActive: () => api.get<ApiResponse>('/elections/active'),
  getByStatus: (status: string) => api.get<ApiResponse>(`/elections/status/${status}`),
  getById: (id: string) => api.get<ApiResponse>(`/elections/${id}`),
  getResults: (id: string) => api.get<ApiResponse>(`/elections/${id}/results`),
  create: (data: any) => api.post<ApiResponse>('/elections', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/elections/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/elections/${id}`),
  nominate: (electionId: string, data: any) => api.post<ApiResponse>(`/elections/${electionId}/nominate`, data),
  secondNomination: (candidateId: string) => api.post<ApiResponse>(`/elections/candidates/${candidateId}/second`),
  withdrawNomination: (candidateId: string) => api.post<ApiResponse>(`/elections/candidates/${candidateId}/withdraw`),
};

// Voting API
export const votingApi = {
  castVote: (data: any) => api.post<ApiResponse>('/voting/cast', data),
  getStatus: (electionId: string) => api.get<ApiResponse>(`/voting/status/${electionId}`),
  verify: (voteId: string) => api.get<ApiResponse>(`/voting/verify/${voteId}`),
  getResults: (electionId: string) => api.get<ApiResponse>(`/voting/results/${electionId}`),
  getHistory: () => api.get<ApiResponse>('/voting/history'),
};
