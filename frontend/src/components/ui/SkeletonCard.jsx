
import PropTypes from 'prop-types';

/**
 * SkeletonCard – placeholder card shown while content loads.
 * Props:
 *   size      – 'sm' | 'md' | 'lg' (controls height)
 *   className – additional Tailwind classes
 */
const SkeletonCard = ({ size = 'md', className = '' }) => {
  const height = {
    sm: 'h-24',
    md: 'h-40',
    lg: 'h-60',
  }[size];
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${height} ${className}`} />
  );
};

SkeletonCard.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default SkeletonCard;
