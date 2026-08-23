import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar - responsive */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

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