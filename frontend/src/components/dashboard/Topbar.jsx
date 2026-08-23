import {
  Search,
  Menu
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { NotificationBell } from "../../contexts/NotificationContext";

export default function Topbar({ toggleMobileMenu }) {
  const { user } = useAuth();

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 md:px-8">
      
      {/* Left Area / Mobile Menu */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Right Area */}
      <div className="flex flex-1 items-center justify-end gap-6">
        
        {/* Search */}
        <div className="hidden md:flex relative w-full max-w-[340px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-11 w-full rounded-xl bg-slate-100/80 pl-10 pr-4 text-[14px] text-slate-700 placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[14px] font-semibold text-slate-800 leading-tight">{user?.name || "User"}</span>
            <span className="text-[12px] font-medium text-slate-500">{user?.role === 'admin' ? 'City Official' : 'Citizen'}</span>
          </div>
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg shadow-inner uppercase">
            {user?.name?.[0] || user?.email?.[0] || "?"}
          </div>
        </div>
      </div>
    </header>
  );
}