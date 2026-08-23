import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function PasswordField({
  label,
  placeholder,
  value,
  onChange,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="
            h-12
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            pr-12
            text-slate-800
            outline-none
            transition-all
            duration-200
            focus:border-blue-600
            focus:ring-4
            focus:ring-blue-100
          "
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}