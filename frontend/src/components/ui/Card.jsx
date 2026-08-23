
import PropTypes from 'prop-types';

/**
 * Card – reusable container component.
 * Props:
 *   variant   – 'default' | 'outlined' | 'interactive' | 'glass'
 *   size      – 'sm' | 'md' | 'lg' (controls padding)
 *   className – additional Tailwind classes
 *   children  – card content
 */
const Card = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
}) => {
  const base = 'bg-white rounded-lg shadow-sm';
  const variantClasses = {
    default: '',
    outlined: 'border border-gray-200',
    interactive: 'cursor-pointer transform hover:scale-[1.02] transition-transform',
    glass: 'bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg border border-white/30',
  }[variant];
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  }[size];
  return (
    <div className={`${base} ${variantClasses} ${sizeClasses} ${className}`}>
      {children}
    </div>
  );
};

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'outlined', 'interactive', 'glass']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Card;
