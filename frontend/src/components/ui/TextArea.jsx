
import PropTypes from 'prop-types';


/**
 * TextArea – reusable multi‑line input component.
 * Supports the same API as Input for consistency.
 */
const TextArea = ({
  label,
  placeholder = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  rows = 4,
  ...rest
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  }[size];

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
      <textarea
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`block w-full border rounded focus:outline-none focus:ring-2 ${sizeClasses} ${variantClasses}`}
        {...rest}
      />
    </div>
  );
};

TextArea.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  rows: PropTypes.number,
};

export default TextArea;
