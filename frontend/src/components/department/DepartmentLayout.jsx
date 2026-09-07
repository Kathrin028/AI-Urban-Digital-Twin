import { useState } from "react";
import Topbar from "../dashboard/Topbar";
import { LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function DepartmentLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* Very simple fixed sidebar for department */}
      <aside className="hidden md:flex w-[260px] flex-col border-r border-slate-200 bg-white">
        <div className="flex h-[72px] items-center px-8 border-b border-slate-100">
          <span className="text-[20px] font-black tracking-tight text-slate-900">
            UrbanMind<span className="text-blue-600">.AI</span>
          </span>
        </div>
        
        <div className="flex-1 p-6">
          <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4">
            <h3 className="text-[12px] font-bold text-blue-900 uppercase tracking-wider mb-1">Workspace</h3>
            <p className="text-[14px] font-medium text-blue-700">Department Portal</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar toggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)} />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-8 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
