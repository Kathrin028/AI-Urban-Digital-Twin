import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import AdminLayout from '../components/admin/AdminLayout';
import { Camera, User, Phone, Save, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi, getImageUrl } from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const Layout = isAdmin ? AdminLayout : DashboardLayout;

  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchApi('/api/users/profile');
        setFormData({
          name: res.name || '',
          phone: res.phone || ''
        });
        if (res.profile_photo) {
          setPhotoPreview(getImageUrl(res.profile_photo));
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        toast.error("Failed to load profile data");
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = new FormData();
      if (formData.name) data.append('name', formData.name);
      if (formData.phone) data.append('phone', formData.phone);
      if (file) data.append('profile_photo', file);

      await fetchApi('/api/users/profile', {
        method: 'PATCH',
        body: data
      });
      
      toast.success('Profile updated successfully!');
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Account Settings</h1>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-md flex items-center justify-center relative z-10">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-slate-300">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handlePhotoChange} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="pt-16 px-8 pb-8">
            <div className="flex items-center gap-2 mb-8 text-slate-500 font-medium">
              <Mail size={16} />
              <span>{user?.email}</span>
              {isAdmin && (
                <span className="ml-3 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[12px] font-bold flex items-center gap-1">
                  <ShieldAlert size={12} /> ADMIN
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 text-[15px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition hover:border-slate-400"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 text-[15px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition hover:border-slate-400"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl font-semibold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save size={18} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;