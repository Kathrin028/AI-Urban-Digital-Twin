import { fetchApi } from './api';

export const getComplaints = async (filters = {}) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.append(key, value);
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return await fetchApi(`/api/complaints${queryString}`, { method: 'GET' });
};

export const saveComplaint = async (complaint) => {
  return await fetchApi('/api/complaints/', {
    method: 'POST',
    body: JSON.stringify(complaint)
  });
};

export const getComplaintById = async (id) => {
  return await fetchApi(`/api/complaints/${id}`, { method: 'GET' });
};

export const getComplaintsByUser = async () => {
  return await fetchApi('/api/complaints/my', { method: 'GET' });
};

export const updateComplaintStatus = async (id, status) => {
  return await fetchApi(`/api/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const uploadComplaintImage = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return await fetchApi(`/api/complaints/${id}/image`, {
    method: 'POST',
    body: formData
  });
};

export const checkDuplicateComplaint = async (data) => {
  return await fetchApi('/api/complaints/check-duplicate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const analyzeComplaintImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return await fetchApi('/api/complaints/analyze-image', {
    method: 'POST',
    body: formData
  });
};
