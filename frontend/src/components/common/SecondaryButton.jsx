import { Link } from "react-router-dom";

export default function SecondaryButton({
  children,
  to,
  type = "button",
  onClick,
  className = "",
  fullWidth = false,
}) {
  const baseStyle = `
    inline-flex items-center justify-center
    px-6 py-3
    rounded-xl
    border border-slate-300
    bg-white
    text-slate-700
    font-medium
    text-sm
    transition-all
    duration-300
    hover:border-blue-600
    hover:text-blue-600
    hover:bg-blue-50
    hover:-translate-y-0.5
    active:translate-y-0
    shadow-sm
    hover:shadow-md
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  if (to) {
    return (
      <Link to={to} className={baseStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={baseStyle}
    >
      {children}
    </button>
  );
}