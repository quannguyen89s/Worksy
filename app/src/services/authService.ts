import apiClient from './apiClient';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string, confirm_password: string) => {
    const response = await apiClient.post('/auth/register', { name, email, password, confirm_password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await apiClient.post('/auth/google-login', { idToken });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOTP: async (email: string, otp: string) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, password: string, confirm_password: string) => {
    const response = await apiClient.post('/auth/reset-password', { email, otp, password, confirm_password });
    return response.data;
  },
};

export default authService;
