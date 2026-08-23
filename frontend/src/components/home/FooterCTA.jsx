import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function FooterCTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 overflow-hidden relative">

      {/* Background Blur */}

      <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: .7 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/20 p-10 lg:p-16"
        >

          <div className="max-w-4xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 bg-white/20 px-5 py-2 rounded-full text-white mb-8">

              <Sparkles size={18} />

              <span className="font-medium">

                AI Powered Smart Governance

              </span>

            </div>

            <h2 className="text-4xl lg:text-6xl font-bold text-white leading-tight">

              Ready to Build

              <span className="block">

                Smarter Cities Together?

              </span>

            </h2>

            <p className="mt-8 text-blue-100 text-lg leading-8 max-w-3xl mx-auto">

              Join thousands of citizens and municipal authorities using
              Artificial Intelligence to create cleaner, safer and smarter
              communities.

            </p>

            <div className="flex flex-wrap justify-center gap-5 mt-10">

              <Link
                to="/register"
                className="group bg-white text-blue-700 font-semibold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition flex items-center gap-3"
              >
                Get Started

                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition"
                />

              </Link>

              <Link
                to="/login"
                className="border border-white/40 text-white px-8 py-4 rounded-2xl hover:bg-white/10 transition font-semibold"
              >
                Explore Dashboard
              </Link>

            </div>

          </div>

        </motion.div>

      </div>

    </section>
  );
}