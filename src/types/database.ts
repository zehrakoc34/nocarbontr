// nctr_1.md §3 — Database Schema tiplemesi

export type OrgType = "CORPORATE" | "SUPPLIER";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "INACTIVE" | "PAST_DUE";
export type ConnectionStatus = "ACTIVE" | "PENDING" | "REJECTED";
export type DataSource = "OCR" | "MANUAL";

export interface Organization {
  id: string;
  name: string;
  tax_id: string;
  type: OrgType;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
}

export interface NetworkConnection {
  id: string;
  company_id: string;
  supplier_id: string;
  status: ConnectionStatus;
  created_at: string;
  // joins
  company?: Organization;
  supplier?: Organization;
}

export interface EmissionData {
  id: string;
  supplier_id: string;
  sector: string;
  year: number;
  emissions_ton_co2: number;
  data_source: DataSource;
  formula_version: string; // "v1", "v2" — nctr_1.md §7.2 formula versioning
  created_at: string;
  updated_at: string;
}

export interface EvidenceVault {
  id: string;
  report_id: string;
  file_url: string;
  verification_hash: string; // SHA-256 — nctr_1.md §7.3 evidence integrity
  upload_date: string;
}

// Supabase DB türleri — @supabase/supabase-js generic ile kullanım için
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, "id" | "created_at">;
        Update: Partial<Omit<Organization, "id" | "created_at">>;
      };
      network_connections: {
        Row: NetworkConnection;
        Insert: Omit<NetworkConnection, "id" | "created_at">;
        Update: Partial<Pick<NetworkConnection, "status">>;
      };
      emission_data: {
        Row: EmissionData;
        Insert: Omit<EmissionData, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<EmissionData, "id" | "supplier_id" | "created_at">>;
      };
      evidence_vault: {
        Row: EvidenceVault;
        Insert: Omit<EvidenceVault, "id">;
        Update: never;
      };
    };
  };
}
