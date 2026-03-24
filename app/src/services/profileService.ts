import apiClient from './apiClient';

export const profileService = {
  getProfile: async () => {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; avatar?: string; location?: { lat: number; lng: number } }) => {
    const response = await apiClient.patch('/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
    const response = await apiClient.patch('/profile/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    return response.data;
  },

  uploadAvatar: async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post('/profile/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default profileService;
