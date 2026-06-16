// =============================================================================
// Tipos do banco de dados — espelham o schema definido em supabase/schema.sql
// =============================================================================

export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type LeadStatus = "pending" | "sent" | "failed";

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: CampaignStatus;
  created_at: string;
}

export interface Lead {
  id: string;
  campaign_id: string;
  company_name: string;
  phone_number: string;
  status: LeadStatus;
  error_message: string | null;
  created_at: string;
}

// Linha enviada ao inserir leads (campos gerados pelo banco são omitidos)
export interface LeadInsert {
  campaign_id: string;
  company_name: string;
  phone_number: string;
  status?: LeadStatus;
}

// Campanha enriquecida com contagens de leads (usada nas listagens/tabelas)
export interface CampaignWithCount extends Campaign {
  total_leads: number;
  sent_count: number;
  failed_count: number;
}

export interface CampaignMetrics {
  campaign_id: string;
  user_id: string;
  campaign_name: string;
  campaign_status: CampaignStatus;
  total_leads: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
}

export interface WhatsAppConnection {
  user_id: string;
  instance_name: string;
  created_at: string;
  updated_at: string;
}

// Tipagem do schema para o supabase-js (uso opcional, garante autocomplete)
export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Campaign, "id" | "user_id" | "created_at">>;
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert & { id?: string; created_at?: string };
        Update: Partial<Omit<Lead, "id" | "campaign_id" | "created_at">>;
      };
      whatsapp_connections: {
        Row: WhatsAppConnection;
        Insert: Omit<WhatsAppConnection, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<WhatsAppConnection, "instance_name" | "updated_at">>;
      };
    };
    Views: {
      campaign_metrics: {
        Row: CampaignMetrics;
      };
    };
  };
}
