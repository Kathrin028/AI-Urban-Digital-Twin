
import PropTypes from 'prop-types';

/**
 * Container – responsive wrapper that centers content.
 * Props:
 *   children   – content
 *   className  – additional Tailwind classes
 */
const Container = ({ children, className = '' }) => (
  <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

Container.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Container;
