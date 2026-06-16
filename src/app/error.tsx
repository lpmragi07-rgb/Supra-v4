"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção, envie para um serviço de monitoramento (ex: Sentry).
    console.error(error);
  }, [error]);

  return (
    <div className="glow-bg flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-900 text-brand-500 shadow-soft">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-serif text-3xl font-semibold text-white">
        Algo deu errado
      </h1>
      <p className="mt-2 max-w-sm text-ink-400">
        Ocorreu um erro inesperado. Tente novamente — se persistir, recarregue a
        página.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-medium text-ink-950 shadow-soft transition-colors hover:bg-ink-100"
      >
        <RotateCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  );
}
