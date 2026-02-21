import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useContent } from "@/lib/content-context";

export function Hero() {
  const { content } = useContent();
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 opacity-[0.25]">
        <img 
          src={content.images.HERO_BACKGROUND.url} 
          alt={content.images.HERO_BACKGROUND.alt} 
          className="w-full h-full object-cover"
          style={{ objectPosition: `${content.images.HERO_BACKGROUND.positionX}% ${content.images.HERO_BACKGROUND.positionY}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>
      
      <div className="container relative z-10 px-4 py-32 text-center flex flex-col items-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          {content.hero.badge}
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 text-foreground tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 text-center">
          {content.hero.titleMain} <br/>
          <span className="text-primary font-light text-4xl md:text-6xl">{content.hero.titleSub}</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 font-light animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 text-center mx-auto">
          {content.hero.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 justify-center w-full">
          <Button 
            size="lg" 
            className="text-lg px-8 rounded-full h-14 shadow-lg shadow-primary/20"
            onClick={scrollToContact}
            data-testid="btn-hero-contact"
          >
            קבעי שיחת היכרות
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 rounded-full h-14 bg-white/50 backdrop-blur hover:bg-white"
            asChild
            data-testid="btn-hero-whatsapp"
          >
            <a href="https://wa.me/972523491792?text=%D7%94%D7%99%D7%99%20%D7%92%D7%9C%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A9%D7%99%D7%97%D7%AA%20%D7%94%D7%99%D7%9B%D7%A8%D7%95%D7%AA%20%D7%A7%D7%A6%D7%A8%D7%94%20%D7%9C%D7%92%D7%91%D7%99%20%D7%A0%D7%95%D7%9E%D7%A8%D7%95%D7%9C%D7%95%D7%92%D7%99%D7%94%20%D7%91%D7%A9%D7%99%D7%9C%D7%95%D7%91%20%D7%90%D7%99%D7%9E%D7%95%D7%9F%20%D7%96%D7%95%D7%92%D7%99." target="_blank" rel="noopener noreferrer">
              <MessageCircle className="ml-2 h-5 w-5 text-[#25D366]" />
              שלחי הודעה בוואטסאפ
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}