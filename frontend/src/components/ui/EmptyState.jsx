
import { FiFolder } from 'react-icons/fi';
import PropTypes from 'prop-types';

/**
 * EmptyState – reusable component displayed when a page or section has no data.
 *
 * Props:
 *   title:        Short headline (e.g., "No complaints found")
 *   description:  Optional supporting text.
 *   icon:         Optional React element to replace the default icon.
 *   className:    Optional additional class names for styling.
 */
const EmptyState = ({ title, description, icon, className }) => {
  const Icon = icon || <FiFolder size={48} className="text-gray-400" />;
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}> 
      {Icon}
      <h2 className="mt-4 text-xl font-semibold text-gray-800">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-gray-600 text-center max-w-md">{description}</p>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.element,
  className: PropTypes.string,
};

EmptyState.defaultProps = {
  description: '',
  icon: null,
  className: '',
};

export default EmptyState;
