import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!form.email.trim()) return "Please enter your email address.";
    if (!form.password) return "Please enter a password.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.agreed) return "You must agree to the Terms & Conditions.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        city: form.city,
      });
      navigate("/citizen", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      
      <div className="mb-10">
        <h2 className="text-[32px] font-bold text-slate-900 tracking-tight">
          Create Account
        </h2>
        <p className="mt-2 text-[15px] text-slate-500">
          Join UrbanMind AI today.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>

        {/* Full Name */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={set("name")}
            className="h-12 w-full rounded-xl border border-slate-300 px-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={set("email")}
            className="h-12 w-full rounded-xl border border-slate-300 px-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Phone Number
          </label>
          <input
            type="text"
            placeholder="+91 XXXXX XXXXX"
            value={form.phone}
            onChange={set("phone")}
            className="h-12 w-full rounded-xl border border-slate-300 px-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400"
          />
        </div>

        {/* City */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            City / Municipality
          </label>
          <select
            value={form.city}
            onChange={set("city")}
            className="h-12 w-full rounded-xl border border-slate-300 px-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white hover:border-slate-400"
          >
            <option value="">Select City</option>
            <option>Coimbatore</option>
            <option>Chennai</option>
            <option>Madurai</option>
            <option>Salem</option>
            <option>Tiruppur</option>
          </select>
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password (min. 6 chars)"
              value={form.password}
              onChange={set("password")}
              className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 text-[15px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="terms"
            checked={form.agreed}
            onChange={set("agreed")}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <label htmlFor="terms" className="text-[14px] font-medium text-slate-600">
            I agree to the Terms &amp; Conditions
          </label>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-[14px] font-medium text-red-600 border border-red-100">
            {error}
          </p>
        )}

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-[0_2px_10px_rgba(15,23,42,0.1)] text-[15px]"
        >
          {isLoading ? "Creating account…" : "Create Account"}
        </button>

      </form>

      <div className="mt-8 border-t border-slate-100 pt-8 text-center">
        <p className="text-[14px] font-medium text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Log in here
          </Link>
        </p>
      </div>

    </div>
  );
}