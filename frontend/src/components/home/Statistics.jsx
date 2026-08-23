export default function Statistics() {
  const stats = [
    {
      number: "25K+",
      label: "Issues Reported",
    },
    {
      number: "120+",
      label: "Municipalities",
    },
    {
      number: "96%",
      label: "Resolution Rate",
    },
    {
      number: "24/7",
      label: "AI Monitoring",
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm md:grid-cols-4">

        {stats.map((item) => (

          <div
            key={item.label}
            className="text-center"
          >

            <h2 className="text-5xl font-bold text-blue-600">
              {item.number}
            </h2>

            <p className="mt-3 text-slate-600">
              {item.label}
            </p>

          </div>

        ))}

      </div>
    </section>
  );
}