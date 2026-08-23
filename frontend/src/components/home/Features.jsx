import {
  BrainCircuit,
  ClipboardCheck,
  BarChart3,
  MapPinned,
} from "lucide-react";

import FeatureCard from "../common/FeatureCard";

const features = [
  {
    title: "Smart Reporting",
    description:
      "Citizens can report civic issues with photos and live GPS location in seconds.",
    icon: <ClipboardCheck size={30} className="text-blue-600" />,
  },
  {
    title: "AI Detection",
    description:
      "YOLOv8 automatically identifies the issue category from uploaded images.",
    icon: <BrainCircuit size={30} className="text-emerald-600" />,
  },
  {
    title: "Priority Prediction",
    description:
      "Artificial Intelligence predicts complaint priority for quicker response.",
    icon: <BarChart3 size={30} className="text-violet-600" />,
  },
  {
    title: "Interactive Maps",
    description:
      "View complaint hotspots and monitor affected areas through live maps.",
    icon: <MapPinned size={30} className="text-orange-500" />,
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-slate-50 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}

        <div className="mx-auto max-w-2xl text-center">

          <span className="inline-flex rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            Features
          </span>

          <h2 className="mt-6 text-5xl font-bold text-slate-900">
            Powerful Features
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Everything required to report, monitor and resolve civic issues
            through Artificial Intelligence.
          </p>

        </div>

        {/* Cards */}

        <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">

          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
            />
          ))}

        </div>

      </div>
    </section>
  );
}