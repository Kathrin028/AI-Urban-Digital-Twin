import { Building2, Mail, Phone, MapPin } from "lucide-react";
import Container from "../common/Container";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-slate-950 text-white"
    >
      <Container>

        <div className="grid gap-12 py-16 md:grid-cols-4">

          {/* Logo */}

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <Building2 size={22} />
              </div>

              <div>

                <h3 className="text-2xl font-bold">
                  UrbanMind <span className="text-blue-500">AI</span>
                </h3>

                <p className="text-slate-400">
                  Smarter Cities
                </p>

              </div>

            </div>

            <p className="mt-6 leading-7 text-slate-400">

              AI-powered civic issue management platform helping
              citizens and municipalities build smarter cities.

            </p>

          </div>

          {/* Platform */}

          <div>

            <h4 className="mb-5 text-lg font-semibold">
              Platform
            </h4>

            <ul className="space-y-3 text-slate-400">

              <li>Features</li>
              <li>AI Detection</li>
              <li>Analytics</li>
              <li>Live Dashboard</li>

            </ul>

          </div>

          {/* Company */}

          <div>

            <h4 className="mb-5 text-lg font-semibold">
              Company
            </h4>

            <ul className="space-y-3 text-slate-400">

              <li>About</li>
              <li>Contact</li>
              <li>Privacy Policy</li>

            </ul>

          </div>

          {/* Contact */}

          <div>

            <h4 className="mb-5 text-lg font-semibold">
              Contact
            </h4>

            <div className="space-y-4 text-slate-400">

              <div className="flex gap-3">
                <Mail size={18} />
                support@urbanmind.ai
              </div>

              <div className="flex gap-3">
                <Phone size={18} />
                +91 98765 43210
              </div>

              <div className="flex gap-3">
                <MapPin size={18} />
                Coimbatore, Tamil Nadu
              </div>

            </div>

          </div>

        </div>

        <div className="border-t border-slate-800 py-6 text-center text-slate-500">

          © 2026 UrbanMind AI. All Rights Reserved.

        </div>

      </Container>
    </footer>
  );
}