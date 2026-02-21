import { useContent } from "@/lib/content-context";

export function About() {
  const { content } = useContent();
  const aboutImage = content.images.ABOUT_IMAGE;

  return (
    <section id="about" className="py-24 bg-gradient-to-b from-white to-[#fdf6f4]">
      <div className="container px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black mb-10 text-center" data-testid="text-about-title">
          {content.about.title}
        </h2>

        <div className="flex justify-center mb-10">
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl" data-testid="img-about-profile">
            <img
              src={aboutImage?.url || "/uploads/about_profile.jpg"}
              alt={aboutImage?.alt || "גל פרידמן מלכה"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border/30 p-8 md:p-12" data-testid="text-about-content">
          {content.about.content.split("\n").map((line, i) => {
            if (line.trim() === "") return <div key={i} className="h-4" />;
            const isQuestion = line.endsWith("?") || line.startsWith("למה");
            const isClosing = line.includes("♥️");
            return (
              <p
                key={i}
                className={`text-lg leading-relaxed ${
                  isQuestion
                    ? "font-bold text-foreground mt-6 mb-2 text-xl"
                    : isClosing
                    ? "font-semibold text-primary mt-4 text-center"
                    : "text-muted-foreground"
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
