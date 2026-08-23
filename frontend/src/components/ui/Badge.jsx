import PropTypes from 'prop-types';

/**
 * Badge – displays a small label/status indicator.
 * Variants map to Tailwind utility classes for colors.
 *   success: green background, white text
 *   warning: amber background, white text
 *   danger:  red background, white text
 *   info:    blue background, white text
 *   default: gray background, white text
 *
 * Props:
 *   variant   – one of the defined variants (default: 'default')
 *   className – additional Tailwind classes for custom styling
 *   children  – badge content
 */
const Badge = ({ variant = 'default', className = '', children }) => {
  const variantClasses = {
    default: 'bg-gray-500 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-amber-600 text-white',
    danger:  'bg-red-600 text-white',
    info:    'bg-blue-600 text-white',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger', 'info']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Badge;
