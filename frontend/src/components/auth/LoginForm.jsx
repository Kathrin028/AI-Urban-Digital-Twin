import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import PasswordField from "../common/PasswordField";
import { useAuth } from "../../hooks/useAuth";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ email, password });
      if (user.role === 'admin') {
        navigate("/admin", { replace: true });
      } else if (user.role === 'department') {
        navigate("/department/dashboard", { replace: true });
      } else {
        navigate("/citizen", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="text-[32px] font-bold text-slate-900 tracking-tight">
          Welcome Back 👋
        </h2>
        <p className="mt-2 text-[15px] text-slate-500">
          Sign in to continue to UrbanMind AI.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>

        <InputField
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-[14px] font-medium text-red-600 border border-red-100">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-[14px] font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-[0_2px_10px_rgba(15,23,42,0.1)] text-[15px]"
        >
          {isLoading ? "Signing in…" : "Login"}
        </button>

      </form>

      <div className="mt-8 rounded-xl bg-blue-50/80 p-5 text-[14px] text-blue-700 space-y-2 border border-blue-100">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Citizen Demo:</span>
          <span className="font-mono bg-blue-100 px-2.5 py-1 rounded-md text-[13px] font-medium">demo@urbanmind.ai</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Admin Demo:</span>
          <span className="font-mono bg-blue-100 px-2.5 py-1 rounded-md text-[13px] font-medium">admin@urbanmind.ai</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Dept Demo:</span>
          <span className="font-mono bg-blue-100 px-2.5 py-1 rounded-md text-[13px] font-medium">dept@urbanmind.ai</span>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-8 text-center">
        <p className="text-[14px] font-medium text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Register here
          </Link>
        </p>
      </div>

    </div>
  );
}