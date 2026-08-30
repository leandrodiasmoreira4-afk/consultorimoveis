import { MessageCircle } from "lucide-react";

const whatsappNumber = "5571981070986";
const whatsappMessage = encodeURIComponent(
  "Olá, Cristian! Vi seu site e gostaria de falar sobre um imóvel."
);

export function WhatsAppFloating() {
  return (
    <a
      className="whatsapp-floating"
      href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com Cristian Oliveira pelo WhatsApp"
    >
      <MessageCircle size={23} strokeWidth={1.8} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}
