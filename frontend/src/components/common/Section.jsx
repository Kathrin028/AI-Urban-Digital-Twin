import Container from "./Container";

export default function Section({
  children,
  background = "white",
  className = "",
  id = "",
}) {
  const backgrounds = {
    white: "bg-white",
    slate: "bg-slate-50",
    dark: "bg-slate-950 text-white",
  };

  return (
    <section
      id={id}
      className={`py-24 ${backgrounds[background]} ${className}`}
    >
      <Container>
        {children}
      </Container>
    </section>
  );
}