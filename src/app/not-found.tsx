import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="glow-bg flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-900 text-brand-500 shadow-soft">
        <Compass className="h-8 w-8" />
      </span>
      <p className="mt-6 font-serif text-6xl font-semibold text-white">404</p>
      <h1 className="mt-2 text-xl font-semibold text-ink-100">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-sm text-ink-400">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-medium text-ink-950 shadow-soft transition-colors hover:bg-ink-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao início
      </Link>
    </div>
  );
}
