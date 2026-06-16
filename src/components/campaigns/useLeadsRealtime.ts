"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/supabase/types";

type LeadsMap = Record<string, Lead[]>;

// Aplica um evento do Realtime (INSERT/UPDATE/DELETE) ao mapa de leads.
function applyChange(
  map: LeadsMap,
  payload: RealtimePostgresChangesPayload<Lead>
): LeadsMap {
  const next: LeadsMap = { ...map };

  const newRow = payload.new as Lead | undefined;
  const oldRow = payload.old as Partial<Lead> | undefined;

  switch (payload.eventType) {
    case "INSERT": {
      if (!newRow) break;
      const list = next[newRow.campaign_id] ?? [];
      if (!list.some((l) => l.id === newRow.id)) {
        next[newRow.campaign_id] = [...list, newRow];
      }
      break;
    }
    case "UPDATE": {
      if (!newRow) break;
      const list = next[newRow.campaign_id] ?? [];
      next[newRow.campaign_id] = list.map((l) =>
        l.id === newRow.id ? newRow : l
      );
      break;
    }
    case "DELETE": {
      const id = oldRow?.id;
      const campaignId = oldRow?.campaign_id;
      if (!id) break;
      if (campaignId && next[campaignId]) {
        next[campaignId] = next[campaignId].filter((l) => l.id !== id);
      } else {
        // Sem campaign_id no payload antigo: varre todas as listas.
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter((l) => l.id !== id);
        }
      }
      break;
    }
  }

  return next;
}

// Mantém o mapa de leads sincronizado em tempo real com a tabela `leads`.
// `enabled` deve ser false em modo demonstração (sem Supabase configurado).
export function useLeadsRealtime(initial: LeadsMap, enabled: boolean) {
  const [leadsMap, setLeadsMap] = useState<LeadsMap>(initial);
  const [isLive, setIsLive] = useState(false);
  const initialRef = useRef(initial);

  // Ressincroniza quando os dados do servidor mudam (ex: após revalidação).
  useEffect(() => {
    if (initialRef.current !== initial) {
      initialRef.current = initial;
      setLeadsMap(initial);
    }
  }, [initial]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel("realtime:leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload: RealtimePostgresChangesPayload<Lead>) => {
          setLeadsMap((prev) => applyChange(prev, payload));
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return { leadsMap, isLive };
}
