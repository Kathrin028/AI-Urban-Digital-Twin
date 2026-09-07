import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  User,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const menu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/citizen",
  },
  {
    title: "Report Issue",
    icon: FilePlus2,
    path: "/report",
  },
  {
    title: "My Complaints",
    icon: ClipboardList,
    path: "/track",
  },
  {
    title: "Profile",
    icon: User,
    path: "/profile",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navClasses = "flex h-full w-[256px] flex-col bg-[#0F172A] text-white border-r border-slate-800 transition-transform duration-300 z-50";
  const mobileClasses = isMobileOpen ? "translate-x-0" : "-translate-x-full";
  const desktopClasses = "md:translate-x-0";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed md:sticky top-0 left-0 ${navClasses} ${mobileClasses} ${desktopClasses}`}>
        
        {/* Logo Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-6 h-[72px] box-content">
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">
              UrbanMind<span className="text-blue-500">.AI</span>
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
              Citizen Portal
            </p>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white transition"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.title}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-lg px-3.5 py-3 text-[14px] font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={20} strokeWidth={2} />
                {item.title}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="border-t border-slate-800 p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}