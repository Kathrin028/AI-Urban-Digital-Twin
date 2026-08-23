
import PropTypes from 'prop-types';

/**
 * SectionHeader – centered title with optional subtitle.
 * Props:
 *   title     – main heading text (string or element)
 *   subtitle  – optional sub‑heading text
 *   className – additional Tailwind classes for the container
 */
const SectionHeader = ({ title, subtitle, className = '' }) => (
  <div className={`text-center mb-8 ${className}`}>
    <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="mt-2 text-lg text-gray-600">{subtitle}</p>}
  </div>
);

SectionHeader.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  className: PropTypes.string,
};

export default SectionHeader;
