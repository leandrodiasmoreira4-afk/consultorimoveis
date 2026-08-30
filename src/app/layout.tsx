import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import "./enhancements.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloating } from "@/components/layout/WhatsAppFloating";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", display: "swap" });

export const metadata: Metadata = {
  title: "Cristian Oliveira | Private Real Estate",
  description: "Consultoria imobiliária premium em Pernambuco, Brasil.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <div className="site-shell">
          <Header />
          <main>{children}</main>
          <Footer />
          <WhatsAppFloating />
        </div>
      </body>
    </html>
  );
}
