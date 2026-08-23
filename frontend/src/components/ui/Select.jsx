
import PropTypes from 'prop-types';

/**
 * Select – simple styled select element.
 * Props:
 *   options   – array of { value, label }
 *   variant   – visual variant (primary, secondary)
 *   size      – size (sm, md, lg)
 *   disabled  – disables the control
 *   className – additional Tailwind classes
 *   onChange  – change handler
 */
const Select = ({
  options = [],
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onChange,
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
    <select
      disabled={disabled}
      className={`block w-full border rounded focus:outline-none focus:ring-2 ${sizeClasses} ${variantClasses} ${className}`}
      onChange={onChange}
      {...rest}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  variant: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
};

export default Select;
