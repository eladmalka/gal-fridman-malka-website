import { useContent } from "@/lib/content-context";

export function Gallery() {
  const { content } = useContent();

  if (content.gallery.images.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <h2 className="text-3xl font-black text-center mb-12">{content.gallery.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.gallery.images.map((img, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md group relative">
              <div className="absolute inset-0 bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end p-4">
                <span className="text-background font-medium drop-shadow-md">{img.alt}</span>
              </div>
              <img 
                src={img.url} 
                alt={img.alt} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={{ objectPosition: `${img.positionX}% ${img.positionY}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}