import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useContent } from "@/lib/content-context";

export function Services() {
  const { content } = useContent();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">{content.services.title}</h2>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            {content.services.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {content.services.cards.map((s, i) => (
            <Card key={i} className="bg-white border-border/40 shadow-lg shadow-primary/5 overflow-hidden group hover:-translate-y-1 transition-all duration-300" data-testid={`service-${i}`}>
              <div className="h-2 bg-gradient-to-l from-primary/60 to-primary/20"></div>
              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-2xl font-bold text-foreground mb-2">{s.title}</CardTitle>
                <p className="text-muted-foreground h-12 font-light">{s.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 pt-4 border-t border-border/50">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-3 text-foreground">
                      <div className="mt-1 bg-primary/10 rounded-full p-1 text-primary">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
