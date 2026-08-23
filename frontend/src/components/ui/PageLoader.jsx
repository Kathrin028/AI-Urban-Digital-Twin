
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';

/**
 * PageLoader – full‑page overlay shown while a page is loading.
 * Props:
 *   message   – optional text displayed under the spinner
 *   size      – spinner size ('sm'|'md'|'lg')
 *   className – additional Tailwind classes for the overlay
 */
const PageLoader = ({ message = 'Loading…', size = 'md', className = '' }) => (
  <div className={`fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50 ${className}`}>
    <LoadingSpinner size={size} />
    {message && <p className="mt-4 text-gray-700">{message}</p>}
  </div>
);

PageLoader.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default PageLoader;
