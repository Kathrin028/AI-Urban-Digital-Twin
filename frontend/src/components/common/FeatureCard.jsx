export default function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div
      className="
         group
         flex
         h-full
         flex-col
         rounded-xl
         border
         border-slate-200
         bg-white
         p-8
         shadow-md
         transition-all
         duration-300
         hover:-translate-y-2
         hover:border-blue-200
         hover:shadow-xl
         hover:scale-105
       "
    >
      {/* Icon */}

      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 transition-all group-hover:bg-blue-50">
        {icon}
      </div>

      {/* Title */}

      <h3 className="text-2xl font-bold text-slate-900">
        {title}
      </h3>

      {/* Description */}

      <p className="mt-5 flex-1 text-base leading-8 text-slate-600">
        {description}
      </p>
    </div>
  );
}