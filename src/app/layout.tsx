import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// Fonte Serif para cabeçalhos/títulos (autoridade premium)
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
});

// Fonte Sans para corpo de texto e painéis de dados
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Supra V4 — Prospecção B2B via WhatsApp",
    template: "%s · Supra V4",
  },
  description:
    "Plataforma premium de prospecção B2B via WhatsApp: gerencie campanhas, importe leads e acompanhe disparos em tempo real.",
  keywords: ["prospecção", "B2B", "WhatsApp", "leads", "campanhas"],
  authors: [{ name: "Supra V4" }],
  openGraph: {
    title: "Supra V4 — Prospecção B2B via WhatsApp",
    description:
      "Gerencie campanhas, importe leads e acompanhe disparos em tempo real.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans">
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
