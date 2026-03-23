import axios from 'axios';

const API_URL = 'http://192.168.1.9:3000/auth';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string, confirm_password: string) => {
    const response = await api.post('/register', { name, email, password, confirm_password });
    return response.data;
  },

  logout: async (accessToken: string) => {
    const response = await api.post('/logout', {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await api.post('/google-login', { idToken });
    return response.data;
  },
};

export default authService;
