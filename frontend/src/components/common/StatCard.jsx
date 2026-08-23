import { motion } from "framer-motion";

export default function StatCard({
  value,
  label,
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="text-center"
    >
      <h3 className="text-4xl font-bold tracking-tight text-slate-900">
        {value}
      </h3>

      <p className="mt-2 text-slate-500 text-sm">
        {label}
      </p>
    </motion.div>
  );
}