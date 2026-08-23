// src/components/features/FeatureHeader.jsx

import PropTypes from 'prop-types';
import SectionHeader from '../../ui/SectionHeader';
import Container from '../../common/Container';
/**
 * FeatureHeader – hero section for the Features page.
 * Displays a title and optional subtitle.
 */
export default function FeatureHeader({ title, subtitle }) {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Container>
        <SectionHeader title={title} subtitle={subtitle} className="mb-8" />
      </Container>
    </section>
  );
}

FeatureHeader.propTypes = {
  /** Main heading text */
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  /** Optional sub‑heading */
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

FeatureHeader.defaultProps = {
  subtitle: null,
};
