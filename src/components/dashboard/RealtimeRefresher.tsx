"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Atualiza os dados do servidor (router.refresh) quando há mudanças em
// `leads`/`campaigns`, com debounce para agrupar rajadas de eventos do worker.
// Mantém o Dashboard (Server Component) com métricas ao vivo.
export function RealtimeRefresher({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 800);
    };

    const channel = supabase
      .channel("realtime:dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, router]);

  return null;
}
