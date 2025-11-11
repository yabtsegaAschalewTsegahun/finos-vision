import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.baseURL + config.url);
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('API error:', error.config?.url, error.response?.status, error.message);
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/login/', { username, password }),
  
  signup: (data: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    username: string;
    phone_number: string;
  }) => api.post('/sign-up/', data),
  
  changePassword: (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => api.post('/change-password/', data),
  
  resetPassword: (email: string) =>
    api.post('/reset-password/', { email }),
  
  resetPasswordConfirm: (uidb64: string, token: string, data: {
    new_password: string;
    confirm_password: string;
  }) => api.post(`/reset-password/confirm/${uidb64}/${token}/`, data),
};

// Budget API
export const budgetApi = {
  getBudgets: () => api.get('/create-budget/'),
  
  createBudget: (data: {
    category: number;
    amount: number;
    transaction?: number;
  }) => api.post('/create-budget/', data),
};

// Transaction API
export const transactionApi = {
  createTransaction: (data: {
    category: number;
    amount: number;
    description: string;
    tx_ref: string;
    status: string;
  }) => api.post('/create-transaction/', data),
};

// Payment API
export const paymentApi = {
  makePayment: () => api.post('/pay/'),
};

// Categories API
export const categoriesApi = {
  getCategories: () => api.get('/categories/'),
};

export default api;
