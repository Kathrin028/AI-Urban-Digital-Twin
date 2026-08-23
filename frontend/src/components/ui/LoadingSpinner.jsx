
import PropTypes from 'prop-types';

/**
 * LoadingSpinner – simple centered spinner using Tailwind animation.
 * Props:
 *   size      – 'sm' | 'md' | 'lg' (controls spinner size)
 *   className – additional Tailwind classes
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  }[size];
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses} border-t-2 border-primary-500 rounded-full animate-spin`}
        aria-label="loading"
      ></div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default LoadingSpinner;
