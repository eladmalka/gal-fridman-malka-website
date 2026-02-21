import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { Trust } from "@/components/landing/trust";
import { Services } from "@/components/landing/services";
import { Benefits } from "@/components/landing/benefits";
import { Gallery } from "@/components/landing/gallery";
import { Contact } from "@/components/landing/contact";
import { Footer } from "@/components/landing/footer";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen font-sans bg-background selection:bg-primary/20 selection:text-primary">
      <ThemeToggle />
      <Hero />
      <About />
      <Trust />
      <Services />
      <Benefits />
      <Gallery />
      <Contact />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
