import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/972523491792?text=%D7%94%D7%99%D7%99%20%D7%92%D7%9C%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A9%D7%99%D7%97%D7%AA%20%D7%94%D7%99%D7%9B%D7%A8%D7%95%D7%AA%20%D7%A7%D7%A6%D7%A8%D7%94%20%D7%9C%D7%92%D7%91%D7%99%20%D7%A0%D7%95%D7%9E%D7%A8%D7%95%D7%9C%D7%95%D7%92%D7%99%D7%94%20%D7%91%D7%A9%D7%99%D7%9C%D7%95%D7%91%20%D7%90%D7%99%D7%9E%D7%95%D7%9F%20%D7%96%D7%95%D7%92%D7%99."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
      aria-label="שלחי הודעה בוואטסאפ"
      data-testid="btn-floating-whatsapp"
    >
      <MessageCircle size={32} />
    </a>
  );
}