import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  deactivateDepartment 
} from '../services/departmentService';
import { useNotifications } from '../contexts/NotificationContext';
import { Building2, Plus, Edit, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentDept, setCurrentDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      addNotification('error', err.message || 'Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDepartments();
  }, [fetchDepartments]);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', description: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setModalMode('edit');
    setCurrentDept(dept);
    setFormData({ name: dept.name, description: dept.description || '', is_active: dept.is_active });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addNotification('error', 'Department name is required');
      return;
    }

    try {
      if (modalMode === 'add') {
        await createDepartment({ name: formData.name, description: formData.description, is_active: formData.is_active });
        addNotification('success', 'Department created successfully');
      } else {
        await updateDepartment(currentDept.id, { name: formData.name, description: formData.description, is_active: formData.is_active });
        addNotification('success', 'Department updated successfully');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      addNotification('error', err.message || `Failed to ${modalMode} department`);
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await deactivateDepartment(id);
        addNotification('success', 'Department deactivated');
      } else {
        await updateDepartment(id, { is_active: true });
        addNotification('success', 'Department reactivated');
      }
      fetchDepartments();
    } catch (err) {
      addNotification('error', err.message || 'Failed to update department status');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="text-blue-600" /> Department Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage municipal departments and their active statuses.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[14px] text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 border-y border-slate-200">
              <tr>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Department</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Description</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Status</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-slate-500">Loading departments...</td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-slate-500 font-medium">No departments found.</td>
                </tr>
              ) : (
                departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-semibold text-slate-900">{dept.name}</div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 max-w-[300px] truncate">
                      {dept.description || 'No description provided'}
                    </td>
                    <td className="px-8 py-5">
                      {dept.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold bg-slate-100 text-slate-600">
                          <ShieldAlert size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition flex items-center gap-1.5 text-[13px]"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeactivate(dept.id, dept.is_active)}
                        className={`px-3 py-1.5 font-semibold rounded-lg transition flex items-center gap-1.5 text-[13px] ${
                          dept.is_active 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {dept.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'add' ? 'Add New Department' : 'Edit Department'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Roads & Infrastructure"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-[15px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Briefly describe department responsibilities..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-[15px] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 select-none">
                  Department is Active
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
                >
                  {modalMode === 'add' ? 'Create Department' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
