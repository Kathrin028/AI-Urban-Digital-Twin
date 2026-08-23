import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import Topbar from "../dashboard/Topbar";

export default function AdminLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Admin Sidebar */}
      <AdminSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar toggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)} isAdmin={true} />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-8 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
