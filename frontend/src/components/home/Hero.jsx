import heroImage from "../../assets/images/hero.png";
import Container from "../common/Container";
import PrimaryButton from "../common/PrimaryButton";
import SecondaryButton from "../common/SecondaryButton";
import { motion } from "framer-motion";
import { CheckCircle, Users, BarChart2, Globe } from "lucide-react";

export default function Hero() {
  return (
    <motion.section
      id="home"
      className="relative overflow-hidden bg-white pt-36 pb-28"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background blur shapes */}
      <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-blue-100 blur-3xl opacity-40" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-cyan-100 blur-3xl opacity-30" />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* LEFT CONTENT */}
          <div>
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2">
              <span className="text-sm font-semibold tracking-wide text-blue-700">
                AI‑Powered Smart City Platform
              </span>
            </div>

            <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 lg:text-6xl">
              AI‑Powered Smart City Platform
              <span className="block text-blue-600">Transforming Civic Complaint Management</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-7 text-slate-600">
              UrbanMind AI enables municipalities to automatically classify, prioritize, and resolve citizen complaints using cutting‑edge artificial intelligence.
            </p>

            <div className="mt-10 flex gap-4">
              <PrimaryButton to="/register">Report Civic Issue</PrimaryButton>
              <SecondaryButton to="/dashboard">View Dashboard</SecondaryButton>
            </div>
          </div>

          {/* RIGHT IMAGE + floating KPI mini‑cards */}
          <div className="relative flex justify-center">
            <img
              src={heroImage}
              alt="UrbanMind AI dashboard"
              className="w-full max-w-md rounded-3xl shadow-2xl"
            />
            {/* Floating KPI mini‑cards */}
            <motion.div
              className="absolute left-0 top-0 bg-white rounded-xl shadow p-3 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle className="text-blue-600" size={18} />
              <div className="text-sm">
                <div className="font-medium text-slate-900">25K+</div>
                <div className="text-slate-500">Complaints Resolved</div>
              </div>
            </motion.div>
            <motion.div
              className="absolute right-0 bottom-0 bg-white rounded-xl shadow p-3 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Users className="text-blue-600" size={18} />
              <div className="text-sm">
                <div className="font-medium text-slate-900">12K+</div>
                <div className="text-slate-500">Active Citizens</div>
              </div>
            </motion.div>
            <motion.div
              className="absolute left-1/2 top-0 transform -translate-x-1/2 bg-white rounded-xl shadow p-3 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <BarChart2 className="text-blue-600" size={18} />
              <div className="text-sm">
                <div className="font-medium text-slate-900">96%</div>
                <div className="text-slate-500">AI Accuracy</div>
              </div>
            </motion.div>
            <motion.div
              className="absolute right-1/2 bottom-0 transform translate-x-1/2 bg-white rounded-xl shadow p-3 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Globe className="text-blue-600" size={18} />
              <div className="text-sm">
                <div className="font-medium text-slate-900">24+</div>
                <div className="text-slate-500">Municipalities</div>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </motion.section>
  );
}
