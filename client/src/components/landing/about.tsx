import { useContent } from "@/lib/content-context";

export function About() {
  const { content } = useContent();

  return (
    <section id="about" className="py-24 bg-gradient-to-b from-white to-[#fdf6f4]">
      <div className="container px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black mb-8 text-center" data-testid="text-about-title">
          {content.about.title}
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-border/30 p-8 md:p-12" data-testid="text-about-content">
          {content.about.content.split("\n").map((line, i) => (
            <p key={i} className={`text-lg leading-relaxed text-muted-foreground ${line.trim() === "" ? "h-4" : ""} ${line.startsWith("למה") ? "font-bold text-foreground mt-6 mb-2 text-xl" : ""}`}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
