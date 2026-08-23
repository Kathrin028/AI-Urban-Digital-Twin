



import FooterCTA from "../components/home/FooterCTA";

import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Features />

      <HowItWorks />
      <FooterCTA />
    </main>
  );
}