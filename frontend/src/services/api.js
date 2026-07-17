import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Inject JWT token on every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('loan_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('loan_token');
      localStorage.removeItem('loan_user');
      const path = window.location.pathname;
      if (!path.startsWith('/login') && path !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: async (username, password) => {
    const res = await apiClient.post('/auth/login/json', { username, password });
    if (res.data.access_token) localStorage.setItem('loan_token', res.data.access_token);
    return res.data;
  },
  register: async (username, email, password, fullName) => {
    const res = await apiClient.post('/auth/register', {
      username, email, password, full_name: fullName,
    });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get('/auth/me');
    localStorage.setItem('loan_user', JSON.stringify(res.data));
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/auth/profile', data);
    localStorage.setItem('loan_user', JSON.stringify(res.data));
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('loan_token');
    localStorage.removeItem('loan_user');
  },
};

// ─── Loans ────────────────────────────────────────────────────────────────────
export const loanService = {
  /** Sandbox predict — does not save to DB */
  sandboxPredict: async (data) => {
    const res = await apiClient.post('/loans/predict', data);
    return res.data;
  },

  /** Submit application — saves to DB and returns XAI data */
  submitApplication: async (data) => {
    const res = await apiClient.post('/loans/applications', data);
    return res.data;
  },

  getApplications: async () => {
    const res = await apiClient.get('/loans/applications');
    return res.data;
  },
  getApplicationById: async (id) => {
    const res = await apiClient.get(`/loans/applications/${id}`);
    return res.data;
  },
  deleteApplication: async (id) => {
    await apiClient.delete(`/loans/applications/${id}`);
  },
  getDashboard: async () => {
    const res = await apiClient.get('/loans/dashboard');
    return res.data;
  },
  chat: async (message) => {
    const res = await apiClient.post('/loans/chat', { message });
    return res.data;
  },
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminService = {
  getDashboard: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },
  getApplications: async (params = {}) => {
    const res = await apiClient.get('/admin/applications', { params });
    return res.data;
  },
  updateStatus: async (id, newStatus) => {
    const res = await apiClient.put(`/admin/applications/${id}/status`, { status: newStatus });
    return res.data;
  },
  deleteApplication: async (id) => {
    await apiClient.delete(`/admin/applications/${id}`);
  },
  getUsers: async () => {
    const res = await apiClient.get('/admin/users');
    return res.data;
  },
  exportCSV: async () => {
    const res = await apiClient.get('/admin/applications/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'loan_applications_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  retrain: async () => {
    const res = await apiClient.post('/admin/retrain');
    return res.data;
  },
};

export default apiClient;
