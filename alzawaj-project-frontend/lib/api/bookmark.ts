import { ApiClient } from './client';

export const bookmarkApi = {
  add: async (profileId: string) => {
    const response = await ApiClient.post('/bookmarks', { profileId });
    return response.data;
  },

  remove: async (profileId: string) => {
    const response = await ApiClient.delete(`/bookmarks/${profileId}`);
    return response.data;
  },

  getAll: async (page = 1, limit = 12) => {
    const response = await ApiClient.get('/bookmarks', { params: { page, limit } });
    return response.data;
  },

  check: async (profileId: string) => {
    const response = await ApiClient.get(`/bookmarks/check/${profileId}`);
    return response.data;
  }
};
