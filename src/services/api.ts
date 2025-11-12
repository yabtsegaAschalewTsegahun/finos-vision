// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Ensure this matches your Django backend URL

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
    // console.log('Making API request to:', config.baseURL + config.url); // Uncomment for debugging
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
    // console.log('API response:', response.config.url, response.status); // Uncomment for debugging
    return response;
  },
  async (error) => {
    console.error('API error:', error.config?.url, error.response?.status, error.message);
    const originalRequest = error.config;

    // Check if it's a 401 Unauthorized and not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to prevent infinite loops

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Attempt to refresh the token
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          // Update the original request's header with the new access token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          // Retry the original request with the new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user'); // Assuming you store user data
        window.location.href = '/login'; // Redirect to login page
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// --- Define API Services based on Postman Collection ---

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

  // Activation link Confirm (assuming this is a POST request with an empty body or simple success message)
  activateAccount: (uidb64: string, token: string) =>
    api.post(`/activate/${uidb64}/${token}`), // Assuming empty body
};

// Budget API
// Note: From Postman, createBudget's "amount" likely maps to "limit" for the budget.
export const budgetApi = {
  // Note: If backend provides a separate GET endpoint for budgets, update this
  getBudgets: () => api.get('/budgets/'), // Assuming /budgets/ endpoint exists for listing
  createBudget: (data: {
    category: number; // ID of the category
    amount: number;   // This seems to be the 'limit' for the budget based on the response
    transaction?: number; // Optional transaction ID
  }) => api.post('/create-budget/', data), // POST /create-budget/
};

// Transaction API
export const transactionApi = {
  createTransaction: (data: {
    category: number;    // ID of the category
    amount: number;
    description: string;
    tx_ref: string;      // Transaction reference (e.g., from payment gateway)
    status: string;      // e.g., "Success", "Failed"
  }) => api.post('/create-transaction/', data), // POST /create-transaction/
  
  // Note: If backend provides a separate GET endpoint for transactions, update this
  getTransactions: () => api.get('/transactions/'), // Assuming /transactions/ endpoint exists for listing
  
  deleteTransaction: (id: string) => api.delete(`/transactions/${id}/`), // DELETE transaction
};

// Payment API
export const paymentApi = {
  // Postman shows a POST to /pay/ with an empty body to initiate payment
  makePayment: () => api.post('/pay/'),
};

// Categories API
export const categoriesApi = {
  getCategories: () => api.get('/view-categories/'), // GET /view-categories/
};

export default api;