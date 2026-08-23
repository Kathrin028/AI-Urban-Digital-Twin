import {
  Camera,
  BrainCircuit,
  BarChart3,
  Building2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: <Camera size={28} />,
    title: "Report Issue",
    desc: "Citizen uploads a complaint with image and location.",
  },
  {
    icon: <BrainCircuit size={28} />,
    title: "AI Detection",
    desc: "YOLOv8 identifies the issue automatically.",
  },
  {
    icon: <BarChart3 size={28} />,
    title: "Priority Score",
    desc: "AI predicts urgency using complaint details.",
  },
  {
    icon: <Building2 size={28} />,
    title: "Municipality Action",
    desc: "Complaint is assigned to the responsible department.",
  },
  {
    icon: <CheckCircle2 size={28} />,
    title: "Issue Resolved",
    desc: "Citizen receives notification after completion.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-slate-50 py-28">

      <div className="mx-auto max-w-7xl px-6">

        <div className="max-w-3xl mx-auto text-center">

          <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-600 uppercase tracking-widest">
            Workflow
          </span>

          <h2 className="mt-6 text-4xl font-bold text-slate-900">
            How UrbanMind AI Works
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            A simple AI-powered workflow that transforms citizen complaints
            into faster municipal action.
          </p>

        </div>

        <div className="mt-20 flex flex-wrap items-start justify-center gap-5">

          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-center"
            >

              <div className="w-56 rounded-2xl bg-white p-6 text-center shadow-md border border-slate-200 hover:shadow-xl transition">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                  {step.icon}

                </div>

                <h3 className="mt-5 text-xl font-semibold text-slate-900">

                  {step.title}

                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">

                  {step.desc}

                </p>

              </div>

              {index !== steps.length - 1 && (
                <ArrowRight
                  size={30}
                  className="mx-4 hidden text-blue-500 lg:block"
                />
              )}

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}