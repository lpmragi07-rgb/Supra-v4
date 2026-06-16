import { Box, Monitor, Smartphone } from "lucide-react";

// Guia rápido — deixa claro que não precisa de conta externa.
export function SetupGuide() {
  return (
    <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5">
      <p className="text-sm font-semibold text-white">
        Como funciona (simples)
      </p>
      <p className="mt-1 text-sm text-ink-400">
        Você <strong className="text-ink-200">não precisa criar conta</strong> em
        nenhum site. O WhatsApp roda no Docker do seu Mac.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3">
          <Box className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
          <div>
            <p className="text-xs font-semibold text-white">1. Docker ligado</p>
            <p className="mt-0.5 text-xs text-ink-400">
              <code className="text-ink-300">cd evolution && docker compose up -d</code>
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3">
          <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
          <div>
            <p className="text-xs font-semibold text-white">2. Site local</p>
            <p className="mt-0.5 text-xs text-ink-400">
              <code className="text-ink-300">npm run dev</code> → abra o link que
              aparecer no terminal
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
          <div>
            <p className="text-xs font-semibold text-white">3. Iniciar campanha</p>
            <p className="mt-0.5 text-xs text-ink-400">
              Clique <strong className="text-ink-200">Iniciar</strong> → escaneie o
              QR Code → pronto
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-500">
        Use o site pelo endereço local do terminal (ex:{" "}
        <code className="text-ink-400">localhost:3000</code>). A URL da Vercel só
        funciona com configuração extra — por enquanto, use local.
      </p>
    </div>
  );
}
