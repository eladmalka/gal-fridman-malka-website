import { useState, useEffect } from "react";
import img1 from "@/assets/images/gallery-1.jpg";
import img2 from "@/assets/images/gallery-2.jpg";
import img3 from "@/assets/images/hero.jpg";

export function Gallery() {
  const [images, setImages] = useState<{url: string, alt: string}[]>([]);
  
  useEffect(() => {
    // Mocking an API call that returns images for the gallery
    setTimeout(() => {
      setImages([
        { url: img1, alt: "קליניקה" },
        { url: img2, alt: "אווירה" },
        { url: img3, alt: "זוגיות" }
      ]);
    }, 500);
  }, []);

  if (images.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <h2 className="text-3xl font-black text-center mb-12">הקליניקה והאווירה</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {images.map((img, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md group relative">
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end p-4">
                <span className="text-white font-medium drop-shadow-md">{img.alt}</span>
              </div>
              <img 
                src={img.url} 
                alt={img.alt} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}