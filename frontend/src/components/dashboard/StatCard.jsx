export default function StatCard({
  title,
  value,
  icon,
  colorClass = "text-blue-600 bg-blue-50",
}) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] min-h-[120px]">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="text-[14px] font-medium text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}