import { Cloud, Smartphone, Upload } from "lucide-react";

// Guia para operadores usando o app em produção (Vercel).
export function SetupGuide() {
  return (
    <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5">
      <p className="text-sm font-semibold text-white">
        Como usar (produção)
      </p>
      <p className="mt-1 text-sm text-ink-400">
        Acesse{" "}
        <strong className="text-ink-200">supra-v4.vercel.app</strong>, faça login
        e siga os passos abaixo. Cada operador conecta o próprio WhatsApp.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3">
          <Upload className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
          <div>
            <p className="text-xs font-semibold text-white">1. Importar leads</p>
            <p className="mt-0.5 text-xs text-ink-400">
              Vá em <strong className="text-ink-200">Upload de Lista</strong> e envie
              seu CSV.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
          <div>
            <p className="text-xs font-semibold text-white">2. Conectar WhatsApp</p>
            <p className="mt-0.5 text-xs text-ink-400">
              Clique <strong className="text-ink-200">Iniciar</strong> na campanha e
              escaneie o QR Code.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3">
          <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
          <div>
            <p className="text-xs font-semibold text-white">3. Disparos automáticos</p>
            <p className="mt-0.5 text-xs text-ink-400">
              O worker na nuvem envia as mensagens. Acompanhe o status em tempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
