import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { WhatsAppConnectPanel } from "@/components/whatsapp/WhatsAppConnectPanel";
import { fetchWhatsAppQR, fetchWhatsAppStatus } from "./actions";

export const metadata: Metadata = {
  title: "WhatsApp",
};

export default async function WhatsAppPage() {
  const [status, qr] = await Promise.all([
    fetchWhatsAppStatus(),
    fetchWhatsAppQR(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <span className="kicker mb-4">Integração</span>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-semibold text-white">
              Conectar <span className="accent-italic">WhatsApp</span>
            </h1>
            <p className="mt-1 text-ink-400">
              Vincule seu número via Evolution API para iniciar os disparos das campanhas.
            </p>
          </div>
        </div>
      </header>

      <WhatsAppConnectPanel initialStatus={status} initialQR={qr} />

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
          Como disparar
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-ink-300">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-400">
              1
            </span>
            Conecte o WhatsApp escaneando o QR Code acima.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-400">
              2
            </span>
            Importe leads em <strong className="text-ink-100">Upload de Lista</strong>.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-400">
              3
            </span>
            Em <strong className="text-ink-100">Campanhas</strong>, clique em{" "}
            <strong className="text-ink-100">Iniciar</strong>.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-400">
              4
            </span>
            O worker na nuvem envia as mensagens automaticamente — cada operador usa seu próprio WhatsApp.
          </li>
        </ol>
      </section>
    </div>
  );
}
