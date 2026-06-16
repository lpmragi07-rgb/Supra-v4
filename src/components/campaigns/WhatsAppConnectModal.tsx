"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, QrCode, Smartphone, X } from "lucide-react";
import {
  fetchWhatsAppQR,
  fetchWhatsAppStatus,
} from "@/app/(app)/whatsapp/actions";

interface WhatsAppConnectModalProps {
  open: boolean;
  campaignName: string;
  onClose: () => void;
  onConnected: () => void;
}

// Modal de conexão WhatsApp — exibido ao iniciar campanha sem sessão ativa.
export function WhatsAppConnectModal({
  open,
  campaignName,
  onClose,
  onConnected,
}: WhatsAppConnectModalProps) {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadQR = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const result = await fetchWhatsAppQR();

      if (!result.configured) {
        setError(
          "Evolution API não configurada no servidor. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY."
        );
        return;
      }

      if (result.connected) {
        onConnected();
        return;
      }

      if (result.error) {
        setError(result.error);
      }

      setQrBase64(result.qrBase64);
      setPairingCode(result.pairingCode);
    });
  }, [onConnected]);

  // Carrega QR ao abrir o modal
  useEffect(() => {
    if (!open) return;
    loadQR();
  }, [open, loadQR]);

  // Poll: detecta quando o usuário escaneou o QR Code
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(async () => {
      const status = await fetchWhatsAppStatus();
      if (status.connected) {
        onConnected();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [open, onConnected]);

  // Atualiza QR Code periodicamente (expira rápido)
  useEffect(() => {
    if (!open) return;

    const refresh = setInterval(() => {
      if (!isPending) loadQR();
    }, 12000);

    return () => clearInterval(refresh);
  }, [open, isPending, loadQR]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                <QrCode className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold text-white">
                  Conectar WhatsApp
                </h2>
                <p className="text-sm text-ink-400">
                  Para iniciar <strong className="text-ink-200">{campaignName}</strong>
                </p>
              </div>
            </div>

            <ol className="mb-6 space-y-2 text-sm text-ink-300">
              <li className="flex gap-2">
                <span className="font-bold text-brand-400">1.</span>
                Abra o WhatsApp no celular
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand-400">2.</span>
                Vá em Aparelhos conectados → Conectar aparelho
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand-400">3.</span>
                Escaneie o QR Code abaixo
              </li>
            </ol>

            {error && !qrBase64 ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <p className="text-sm text-brand-300">{error}</p>
                <button
                  type="button"
                  onClick={loadQR}
                  disabled={isPending}
                  className="rounded-xl bg-ink-800 px-4 py-2 text-sm font-medium text-white hover:bg-ink-700"
                >
                  Tentar novamente
                </button>
              </div>
            ) : qrBase64 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="overflow-hidden rounded-2xl border border-ink-700 bg-white p-3">
                  <Image
                    src={qrBase64}
                    alt="QR Code WhatsApp"
                    width={220}
                    height={220}
                    unoptimized
                    className="h-56 w-56"
                  />
                </div>
                {pairingCode && (
                  <p className="text-sm text-ink-400">
                    Código:{" "}
                    <strong className="font-mono text-white">{pairingCode}</strong>
                  </p>
                )}
                <p className="flex items-center gap-2 text-xs text-ink-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Aguardando conexão… A campanha inicia automaticamente.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
                <p className="text-sm text-ink-400">Gerando QR Code…</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-ink-800 bg-ink-850/50 px-4 py-3">
              <Smartphone className="h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs text-ink-400">
                Após conectar, os disparos começam automaticamente pelo worker.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
