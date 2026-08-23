import { fetchApi } from './api';

export const getDashboardStats = async () => {
  return await fetchApi('/api/admin/dashboard/stats');
};

export const getHotspots = async () => {
  return await fetchApi('/api/admin/hotspots');
};

export const getAnalytics = async () => {
  return await fetchApi('/api/admin/analytics');
};
