// src/components/features/FeatureGrid.jsx


import FeatureCard from '../../common/FeatureCard';
import Section from '../../common/Section';
import { FEATURES } from '../../constants/features';
/**
 * FeatureGrid – renders a responsive grid of FeatureCard components.
 * Data is sourced from src/constants/features.js, ensuring no hard‑coded markup.
 */
export default function FeatureGrid() {
  return (
    <Section background="slate" className="py-12" id="features-grid">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((item, idx) => (
          <FeatureCard
            key={idx}
            icon={<span aria-hidden="true" className="text-3xl" role="img">{item.icon}</span>}
            title={item.title}
            description={item.description}
          >
            {item.badge && (
              <span className="sr-only">Badge: {item.badge}</span>
            )}
          </FeatureCard>
        ))}
      </div>
    </Section>
  );
}


