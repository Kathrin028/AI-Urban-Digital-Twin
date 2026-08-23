import PropTypes from 'prop-types';

/**
 * Input – reusable text input component.
 * Props:
 *   label       – optional label text
 *   placeholder – input placeholder
 *   type        – input type (text, email, password, etc.)
 *   variant     – visual variant ('primary' | 'secondary')
 *   size        – size ('sm' | 'md' | 'lg')
 *   disabled    – disables the input
 *   className   – additional Tailwind classes
 *   icon        – optional React element rendered inside the input (e.g., an icon)
 */
const Input = ({
  label,
  placeholder = '',
  type = 'text',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
  ...rest
}) => {

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  }[size];

  const base = 'block w-full border rounded focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'border-gray-300 focus:ring-primary-500',
    secondary: 'border-gray-400 focus:ring-primary-300',
  }[variant];

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-gray-400">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`${base} ${sizeClasses} ${variantClasses} ${icon ? 'pl-10' : ''}`}
          {...rest}
        />
      </div>
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.element,
};

export default Input;
