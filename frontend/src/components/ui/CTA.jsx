
import PropTypes from 'prop-types';
import Button from './Button';

/**
 * CTA – call to action block.
 * Props:
 *   title           – main heading (string or element)
 *   description     – supporting text (string or element)
 *   primaryAction   – { label, onClick } for primary button
 *   secondaryAction – { label, onClick } for secondary button (optional)
 *   className       – additional Tailwind classes for the container
 */
const CTA = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => (
  <section className={`flex flex-col items-center text-center p-8 bg-gray-50 rounded ${className}`}>
    <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
    {description && <p className="text-gray-700 mb-6">{description}</p>}
    <div className="flex space-x-4">
      {primaryAction && (
        <Button
          variant="primary"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
        </Button>
      )}
      {secondaryAction && (
        <Button
          variant="secondary"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
        >
          {secondaryAction.label}
        </Button>
      )}
    </div>
  </section>
);

CTA.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
  }),
  className: PropTypes.string,
};

export default CTA;
