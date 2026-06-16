"use client";

import { ChevronUp } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// Rodapé institucional da marca V4 Almeida & Co.
export function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Marca */}
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="text-sm font-semibold tracking-[0.25em] text-white">
              ALMEIDA &amp; CO.
            </span>
          </div>

          {/* Voltar ao topo */}
          <button
            type="button"
            onClick={scrollToTop}
            className="group flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-white"
          >
            <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Retornar ao topo
          </button>
        </div>

        {/* Linha divisória com leve brilho vermelho */}
        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-brand-600/50 to-transparent" />

        <p className="text-center text-xs text-ink-500">
          {year} © V4 Almeida e Co. Todos os direitos reservados.{" "}
          <a
            href="#"
            className="text-ink-400 transition-colors hover:text-white"
          >
            Políticas de privacidade
          </a>
        </p>
      </div>
    </footer>
  );
}
