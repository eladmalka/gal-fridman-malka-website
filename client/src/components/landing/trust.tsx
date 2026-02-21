import { Card, CardContent } from "@/components/ui/card";
import { Star, Target, Heart, Sparkles } from "lucide-react";
import { useContent } from "@/lib/content-context";

export function Trust() {
  const { content } = useContent();
  const highlights = [
    { icon: Target, text: "אבחון חד ומדויק" },
    { icon: Heart, text: "כלים זוגיים פרקטיים" },
    { icon: Sparkles, text: "תהליך מותאם אישית" }
  ];

  const testimonials = [
    {
      text: "הפגישה עם גל נתנה לנו בהירות מדהימה. פתאום הבנו למה אנחנו נתקעים על אותם דברים שוב ושוב.",
      name: "מיכל ודניאל"
    },
    {
      text: "השילוב של המספרים עם פרקטיקה זוגית זה משהו שלא ראיתי בשום מקום אחר. מדויק ומעצים.",
      name: "שירה"
    },
    {
      text: "גל יצרה עבורנו מרחב בטוח ונעים. יצאנו עם ארגז כלים משמעותי ליומיום שלנו.",
      name: "יעל ותומר"
    }
  ];

  return (
    <section className="py-20 bg-card">
      <div className="container px-4">
        {/* Value Strip */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-20 pb-10 border-b border-border/50">
          {highlights.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-3 text-center" data-testid={`valuestrip-${i}`}>
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary mb-2">
                <h.icon size={28} strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-medium text-xl text-foreground">{h.text}</h3>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-foreground">{content.trust.testimonialsTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="bg-background/50 border-none shadow-sm hover:shadow-md transition-shadow" data-testid={`testimonial-${i}`}>
              <CardContent className="pt-8 text-center flex flex-col items-center h-full">
                <div className="flex gap-1 mb-6 text-primary">
                  {[...Array(5)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                </div>
                <p className="text-lg text-foreground mb-6 flex-grow leading-relaxed font-light">"{t.text}"</p>
                <div className="font-heading font-medium text-primary">— {t.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}