import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import Container from "../common/Container";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "Contact", href: "#footer" },
];

export default function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white shadow-md px-6">
      <Container>
        <div className="flex h-[72px] items-center justify-between">

          {/* Logo */}

          <Link to="/" className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">

              <Building2 size={22} />

            </div>

            <div>

              <h1 className="text-lg font-bold text-slate-900">
                UrbanMind <span className="text-blue-600">AI</span>
              </h1>

              <p className="text-xs text-slate-500">
                Smarter Cities
              </p>

            </div>

          </Link>

          {/* Center Navigation */}

          <nav className="hidden md:flex items-center gap-10">

            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-slate-700 transition hover:text-blue-600"
              >
                {item.name}
              </a>
            ))}

          </nav>

          {/* Right Buttons */}

          <div className="flex items-center gap-4">

            <Link
              to="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Report Issue
            </Link>

          </div>

        </div>
      </Container>
    </header>
  );
}