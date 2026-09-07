import { fetchApi } from './api';

export const getDepartments = async () => {
  return await fetchApi('/api/admin/departments', { method: 'GET' });
};

export const createDepartment = async (departmentData) => {
  return await fetchApi('/api/admin/departments', {
    method: 'POST',
    body: JSON.stringify(departmentData),
  });
};

export const updateDepartment = async (id, departmentData) => {
  return await fetchApi(`/api/admin/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(departmentData),
  });
};

export const deactivateDepartment = async (id) => {
  return await fetchApi(`/api/admin/departments/${id}`, {
    method: 'DELETE',
  });
};
