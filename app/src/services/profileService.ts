import apiClient from './apiClient';

export const profileService = {
  getProfile: async () => {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; avatar?: string }) => {
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
    const filename = uri.split('/').pop()?.split('?')[0] || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = (match?.[1] || 'jpg').toLowerCase();
    const mime =
      ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'heic'
              ? 'image/heic'
              : 'image/jpeg';

    formData.append('avatar', {
      uri,
      name: filename.includes('.') ? filename : `${filename}.jpg`,
      type: mime,
    } as any);

    const response = await apiClient.post('/profile/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default profileService;
