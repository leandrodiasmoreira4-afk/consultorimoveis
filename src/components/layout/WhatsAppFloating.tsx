"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

function normalizeWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function WhatsAppFloating() {
  const [number, setNumber] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    void supabase
      .from("consultant_profiles")
      .select("whatsapp")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.whatsapp) setNumber(normalizeWhatsApp(data.whatsapp));
      });
  }, []);

  if (!number) return null;

  const message = encodeURIComponent("Olá, Cristian! Vi seu site e gostaria de falar sobre um imóvel.");

  return (
    <a
      className="whatsapp-floating"
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com Cristian Oliveira pelo WhatsApp"
    >
      <MessageCircle size={23} strokeWidth={1.8} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}
