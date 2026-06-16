"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  Unplug,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import {
  fetchWhatsAppQR,
  fetchWhatsAppStatus,
  logoutWhatsApp,
  restartWhatsApp,
} from "@/app/(app)/whatsapp/actions";
import type { EvolutionQRResult, EvolutionStatus } from "@/lib/evolution";

const stateLabels: Record<string, string> = {
  open: "Conectado",
  close: "Desconectado",
  connecting: "Conectando…",
  not_configured: "Não configurado",
  error: "Erro",
  unknown: "Desconhecido",
};

export function WhatsAppConnectPanel({
  initialStatus,
  initialQR,
}: {
  initialStatus: EvolutionStatus;
  initialQR: EvolutionQRResult;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [qr, setQr] = useState(initialQR);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const nextStatus = await fetchWhatsAppStatus();
      setStatus(nextStatus);

      if (nextStatus.connected) {
        setQr({
          configured: true,
          connected: true,
          qrBase64: null,
          pairingCode: null,
        });
        return;
      }

      const nextQR = await fetchWhatsAppQR();
      setQr(nextQR);
    });
  }, []);

  // Atualiza status automaticamente enquanto aguarda conexão.
  useEffect(() => {
    if (!status.configured || status.connected) return;

    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [status.configured, status.connected, refresh]);

  const handleRestart = () => {
    startTransition(async () => {
      const result = await restartWhatsApp();
      if (!result.ok) {
        toast({
          variant: "error",
          title: "Falha ao reiniciar",
          description: result.error,
        });
        return;
      }
      toast({ variant: "success", title: "Instância reiniciada" });
      refresh();
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logoutWhatsApp();
      if (!result.ok) {
        toast({
          variant: "error",
          title: "Falha ao desconectar",
          description: result.error,
        });
        return;
      }
      toast({ variant: "success", title: "WhatsApp desconectado" });
      refresh();
    });
  };

  if (!status.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolution API não configurada</CardTitle>
          <CardDescription>
            Adicione as variáveis no <code className="text-ink-300">.env.local</code> e
            reinicie o servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-xs text-ink-400">
          <p>EVOLUTION_API_URL=https://sua-evolution.com</p>
          <p>EVOLUTION_API_KEY=sua_api_key</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status.connected ? (
              <Wifi className="h-5 w-5 text-emerald-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-400" />
            )}
            Status da conexão
          </CardTitle>
          <CardDescription>
            Instância: <strong className="text-ink-200">{status.instance}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-850/50 px-4 py-3">
            {status.connected ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-400" />
            )}
            <div>
              <p className="font-medium text-white">
                {stateLabels[status.state] ?? status.state}
              </p>
              <p className="text-sm text-ink-400">
                {status.connected
                  ? "Pronto para disparar campanhas ativas."
                  : "Escaneie o QR Code ao lado para conectar."}
              </p>
            </div>
          </div>

          {status.error && (
            <p className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
              {status.error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              disabled={isPending}
            >
              Reiniciar instância
            </Button>
            {status.connected && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                disabled={isPending}
              >
                <Unplug className="h-4 w-4" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-brand-500" />
            Conectar WhatsApp
          </CardTitle>
          <CardDescription>
            Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status.connected ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Smartphone className="h-8 w-8" />
              </span>
              <p className="text-lg font-medium text-white">WhatsApp conectado!</p>
              <p className="max-w-xs text-sm text-ink-400">
                Vá em Campanhas e clique em <strong className="text-ink-200">Iniciar</strong> para
                começar os disparos.
              </p>
            </div>
          ) : qr.qrBase64 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="overflow-hidden rounded-2xl border border-ink-700 bg-white p-3">
                <Image
                  src={qr.qrBase64}
                  alt="QR Code WhatsApp"
                  width={240}
                  height={240}
                  unoptimized
                  className="h-60 w-60"
                />
              </div>
              {qr.pairingCode && (
                <p className="text-sm text-ink-400">
                  Código de pareamento:{" "}
                  <strong className="font-mono text-white">{qr.pairingCode}</strong>
                </p>
              )}
              <p className="text-center text-xs text-ink-500">
                O QR Code atualiza automaticamente a cada 8 segundos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
              <p className="text-sm text-ink-400">
                {qr.error ?? "Gerando QR Code… Clique em Atualizar se demorar."}
              </p>
              <Button variant="secondary" size="sm" onClick={refresh} disabled={isPending}>
                Gerar QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
