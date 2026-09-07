import {
  FilePlus2,
  ClipboardList,
} from "lucide-react";

import { Link } from "react-router-dom";

const actions = [
  {
    title: "Report Issue",
    desc: "Submit a new civic complaint",
    icon: <FilePlus2 size={24} />,
    path: "/report",
  },
  {
    title: "Track Complaint",
    desc: "Check the status of your reports",
    icon: <ClipboardList size={24} />,
    path: "/track",
  },
];

export default function QuickActions() {
  return (
    <section>
      <h2 className="mb-6 text-[18px] font-semibold text-slate-900 tracking-tight">
        Quick Actions
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.path}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg flex items-start gap-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              {action.icon}
            </div>
            <div className="flex flex-col">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1 transition-colors group-hover:text-blue-600">
                {action.title}
              </h3>
              <p className="text-[13px] font-medium text-slate-500">
                {action.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}