import { motion } from "framer-motion";

export default function SectionTitle({
  badge,
  title,
  subtitle,
  align = "center",
}) {
  const alignment =
    align === "left"
      ? "items-start text-left"
      : "items-center text-center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col ${alignment} max-w-3xl mx-auto mb-16`}
    >
      {badge && (
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
          {badge}
        </span>
      )}

      <h2 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-5 text-lg leading-8 text-slate-600">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}