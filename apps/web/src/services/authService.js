import api from './api';

export const authService = {
  async register({ fullName, email, password }) {
    const response = await api.post('/api/auth/register', { fullName, email, password });
    return response.data;
  },

  async login({ email, password }) {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  async googleLogin(credential) {
    const response = await api.post('/api/auth/google', { credential });
    return response.data;
  },

  async logout() {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  async me() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  async updateProfile({ fullName, email }) {
    const response = await api.put('/api/auth/profile', { fullName, email });
    return response.data;
  },

  async changePassword({ currentPassword, newPassword }) {
    const response = await api.put('/api/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  async forgotPassword({ email }) {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword({ token, password }) {
    const response = await api.post('/api/auth/reset-password', { token, password });
    return response.data;
  }
};
export default authService;
