// src/pages/Features.jsx

import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import FeatureHeader from '../components/features/FeatureHeader';
import FeatureGrid from '../components/features/FeatureGrid';
import CTA from '../components/ui/CTA';

/**
 * Features page – assembles the public sections for the Features overview.
 * Uses React Router for CTA navigation and premium copy.
 */
export default function Features() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Navigate to registration or onboarding flow
    navigate('/register');
  };

  return (
    <PublicLayout>
      <FeatureHeader
        title="Powerful AI Capabilities"
        subtitle="AI-powered tools that help citizens and municipalities report, analyze, and resolve civic issues efficiently."
      />
      <FeatureGrid />
      <CTA
        title="Ready to Transform Your City?"
        description="Start your digital twin journey today."
        primaryAction={{ label: 'Get Started', onClick: handleGetStarted, disabled: false }}
        className="my-12"
      />
    </PublicLayout>
  );
}
