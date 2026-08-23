import DashboardLayout from "../components/dashboard/DashboardLayout";

function Settings() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account preferences and application settings.</p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="text-sm font-medium text-slate-700">Email notifications for status updates</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="text-sm font-medium text-slate-700">Push notifications for new alerts</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Appearance</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="radio" name="theme" className="h-5 w-5 border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="text-sm font-medium text-slate-700">Light Theme</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="theme" className="h-5 w-5 border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-slate-700">Dark Theme</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all associated data.</p>
          <button className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition">
            Delete Account
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
