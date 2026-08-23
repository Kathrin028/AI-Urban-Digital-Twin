export default function WelcomeBanner({
  name = "Citizen",
}) {
  return (
    <section className="mb-2 flex flex-col">
      <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
        Welcome Back, {name}
      </h1>
      <p className="mt-1.5 text-[15px] font-medium text-slate-500 max-w-2xl">
        Manage your civic complaints, track their progress, and help build smarter cities with UrbanMind AI.
      </p>
    </section>
  );
}