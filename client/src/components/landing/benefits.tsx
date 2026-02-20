import { useContent } from "@/lib/content-context";

export function Benefits() {
  const { content } = useContent();
  return (
    <section className="py-24 bg-white">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">{content.benefits.title}</h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed text-center">
            {content.benefits.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="space-y-8 pr-0 md:pr-8">
            {content.benefits.items.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="text-4xl text-primary font-black opacity-30">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-light">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-primary/10 z-10 mix-blend-multiply"></div>
            <img src={content.images.BENEFITS_IMAGE.url} alt={content.images.BENEFITS_IMAGE.alt} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
