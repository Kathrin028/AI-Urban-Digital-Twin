
import PropTypes from 'prop-types';
import { useTheme } from '../../hooks/useTheme';

/**
 * Button – reusable button component.
 * Props:
 *   variant: 'primary' | 'secondary' (default: 'primary')
 *   size: 'sm' | 'md' | 'lg' (default: 'md')
 *   onClick: handler
 *   disabled: boolean
 *   children: button label
 */
const Button = ({ variant = 'primary', size = 'md', onClick, disabled, children, className }) => {
  const theme = useTheme();
  const baseClasses = `inline-flex items-center justify-center font-medium rounded ${theme.spacing.md}`;
  const variants = {
    primary: `bg-${theme.colors.primary} text-white hover:bg-${theme.colors.primary} focus:ring-2 focus:ring-${theme.colors.primary}`,
    secondary: `bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400`
  }[variant];
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }[size];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants} ${sizes} ${className}`}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Button;
