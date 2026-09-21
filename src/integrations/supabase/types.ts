export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_request: {
        Row: {
          decided_at: string | null
          id: string
          investor_user_id: string
          note: string | null
          project_id: string
          requested_at: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          decided_at?: string | null
          id?: string
          investor_user_id: string
          note?: string | null
          project_id: string
          requested_at?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          decided_at?: string | null
          id?: string
          investor_user_id?: string
          note?: string | null
          project_id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "access_request_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      answer: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_stack_item: {
        Row: {
          amount: number | null
          created_at: string
          financial_summary_id: string
          id: string
          label: string
          provider: string | null
          share_pct: number | null
          sort_order: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          financial_summary_id: string
          id?: string
          label: string
          provider?: string | null
          share_pct?: number | null
          sort_order?: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          financial_summary_id?: string
          id?: string
          label?: string
          provider?: string | null
          share_pct?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "capital_stack_item_financial_summary_id_fkey"
            columns: ["financial_summary_id"]
            isOneToOne: false
            referencedRelation: "financial_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_profiles: {
        Row: {
          company_name: string | null
          countries_of_operation: string[] | null
          created_at: string
          developer_type: Database["public"]["Enums"]["developer_type"] | null
          full_name: string
          id: string
          organization_id: string | null
          position: string | null
          project_stages: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          countries_of_operation?: string[] | null
          created_at?: string
          developer_type?: Database["public"]["Enums"]["developer_type"] | null
          full_name: string
          id?: string
          organization_id?: string | null
          position?: string | null
          project_stages?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          countries_of_operation?: string[] | null
          created_at?: string
          developer_type?: Database["public"]["Enums"]["developer_type"] | null
          full_name?: string
          id?: string
          organization_id?: string | null
          position?: string | null
          project_stages?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      document: {
        Row: {
          access_level: Database["public"]["Enums"]["document_access"]
          category: string | null
          created_at: string
          file_type: string | null
          id: string
          name: string
          page_count: number | null
          project_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["document_access"]
          category?: string | null
          created_at?: string
          file_type?: string | null
          id?: string
          name: string
          page_count?: number | null
          project_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["document_access"]
          category?: string | null
          created_at?: string
          file_type?: string | null
          id?: string
          name?: string
          page_count?: number | null
          project_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_grant: {
        Row: {
          created_at: string
          document_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_grant_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_summary: {
        Row: {
          capex: number | null
          concession_term_years: number | null
          created_at: string
          currency: string
          equity_required: number | null
          first_revenue_year: number | null
          funding_progress_pct: number | null
          funding_remaining: number | null
          id: string
          min_ticket: number | null
          npv: number | null
          payback_years: number | null
          project_id: string
          target_irr_pct: number | null
          unleveraged_irr_pct: number | null
          updated_at: string
        }
        Insert: {
          capex?: number | null
          concession_term_years?: number | null
          created_at?: string
          currency?: string
          equity_required?: number | null
          first_revenue_year?: number | null
          funding_progress_pct?: number | null
          funding_remaining?: number | null
          id?: string
          min_ticket?: number | null
          npv?: number | null
          payback_years?: number | null
          project_id: string
          target_irr_pct?: number | null
          unleveraged_irr_pct?: number | null
          updated_at?: string
        }
        Update: {
          capex?: number | null
          concession_term_years?: number | null
          created_at?: string
          currency?: string
          equity_required?: number | null
          first_revenue_year?: number | null
          funding_progress_pct?: number | null
          funding_remaining?: number | null
          id?: string
          min_ticket?: number | null
          npv?: number | null
          payback_years?: number | null
          project_id?: string
          target_irr_pct?: number | null
          unleveraged_irr_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_summary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string
          id: string
          investment_range:
            | Database["public"]["Enums"]["investment_range"]
            | null
          investor_type: Database["public"]["Enums"]["investor_type"] | null
          regions_of_interest: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name: string
          id?: string
          investment_range?:
            | Database["public"]["Enums"]["investment_range"]
            | null
          investor_type?: Database["public"]["Enums"]["investor_type"] | null
          regions_of_interest?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          investment_range?:
            | Database["public"]["Enums"]["investment_range"]
            | null
          investor_type?: Database["public"]["Enums"]["investor_type"] | null
          regions_of_interest?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      milestone: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["milestone_status"]
          target_date: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          target_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          country_code: string | null
          created_at: string
          founded_year: number | null
          hq_city: string | null
          id: string
          name: string
          org_type: string
          total_capacity_mw: number | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          founded_year?: number | null
          hq_city?: string | null
          id?: string
          name: string
          org_type: string
          total_capacity_mw?: number | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          country_code?: string | null
          created_at?: string
          founded_year?: number | null
          hq_city?: string | null
          id?: string
          name?: string
          org_type?: string
          total_capacity_mw?: number | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      project: {
        Row: {
          capacity_mw: number
          city: string
          country_code: string
          created_at: string
          description: string | null
          developer_id: string
          headline_co2_tonnes: number | null
          headline_investment: number | null
          headline_irr_pct: number | null
          households_served: number | null
          id: string
          latitude: number | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage"]
          longitude: number | null
          network_length_km: number | null
          project_type: Database["public"]["Enums"]["project_type"]
          slug: string
          summary: string | null
          technology: Database["public"]["Enums"]["technology"]
          timeline_end: string | null
          timeline_start: string | null
          title: string
          updated_at: string
          verified: boolean
          visibility: Database["public"]["Enums"]["project_visibility"]
        }
        Insert: {
          capacity_mw: number
          city: string
          country_code: string
          created_at?: string
          description?: string | null
          developer_id: string
          headline_co2_tonnes?: number | null
          headline_investment?: number | null
          headline_irr_pct?: number | null
          households_served?: number | null
          id?: string
          latitude?: number | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage"]
          longitude?: number | null
          network_length_km?: number | null
          project_type: Database["public"]["Enums"]["project_type"]
          slug: string
          summary?: string | null
          technology: Database["public"]["Enums"]["technology"]
          timeline_end?: string | null
          timeline_start?: string | null
          title: string
          updated_at?: string
          verified?: boolean
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Update: {
          capacity_mw?: number
          city?: string
          country_code?: string
          created_at?: string
          description?: string | null
          developer_id?: string
          headline_co2_tonnes?: number | null
          headline_investment?: number | null
          headline_irr_pct?: number | null
          households_served?: number | null
          id?: string
          latitude?: number | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          longitude?: number | null
          network_length_km?: number | null
          project_type?: Database["public"]["Enums"]["project_type"]
          slug?: string
          summary?: string | null
          technology?: Database["public"]["Enums"]["technology"]
          timeline_end?: string | null
          timeline_start?: string | null
          title?: string
          updated_at?: string
          verified?: boolean
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "project_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interest: {
        Row: {
          id: string
          indicated_commitment: number | null
          introduced_at: string
          investor_user_id: string
          project_id: string
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
        }
        Insert: {
          id?: string
          indicated_commitment?: number | null
          introduced_at?: string
          investor_user_id: string
          project_id: string
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Update: {
          id?: string
          indicated_commitment?: number | null
          introduced_at?: string
          investor_user_id?: string
          project_id?: string
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_interest_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      public_funding: {
        Row: {
          amount: number | null
          created_at: string
          financial_summary_id: string
          id: string
          programme: string | null
          source: string
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          financial_summary_id: string
          id?: string
          programme?: string | null
          source: string
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          financial_summary_id?: string
          id?: string
          programme?: string | null
          source?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_funding_financial_summary_id_fkey"
            columns: ["financial_summary_id"]
            isOneToOne: false
            referencedRelation: "financial_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      question: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_public: boolean
          project_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_public?: boolean
          project_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_public?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_stream: {
        Row: {
          counterparty: string | null
          created_at: string
          financial_summary_id: string
          id: string
          pct_of_revenue: number | null
          stream: string
          structure: string | null
        }
        Insert: {
          counterparty?: string | null
          created_at?: string
          financial_summary_id: string
          id?: string
          pct_of_revenue?: number | null
          stream: string
          structure?: string | null
        }
        Update: {
          counterparty?: string | null
          created_at?: string
          financial_summary_id?: string
          id?: string
          pct_of_revenue?: number | null
          stream?: string
          structure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_stream_financial_summary_id_fkey"
            columns: ["financial_summary_id"]
            isOneToOne: false
            referencedRelation: "financial_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      risk: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          mitigation: string | null
          project_id: string
          severity: Database["public"]["Enums"]["risk_severity"]
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          mitigation?: string | null
          project_id: string
          severity?: Database["public"]["Enums"]["risk_severity"]
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          mitigation?: string | null
          project_id?: string
          severity?: Database["public"]["Enums"]["risk_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "risk_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      sdg_alignment: {
        Row: {
          created_at: string
          id: string
          note: string | null
          sdg_number: number
          sustainability_profile_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          sdg_number: number
          sustainability_profile_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          sdg_number?: number
          sustainability_profile_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdg_alignment_sustainability_profile_id_fkey"
            columns: ["sustainability_profile_id"]
            isOneToOne: false
            referencedRelation: "sustainability_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      sustainability_profile: {
        Row: {
          co2_tonnes_per_year: number | null
          created_at: string
          equivalent_cars: number | null
          eu_taxonomy_aligned: boolean | null
          eu_taxonomy_objective: string | null
          id: string
          lifetime_reduction_tonnes: number | null
          project_id: string
          renewable_share_pct: number | null
          sfdr_article: number | null
          updated_at: string
        }
        Insert: {
          co2_tonnes_per_year?: number | null
          created_at?: string
          equivalent_cars?: number | null
          eu_taxonomy_aligned?: boolean | null
          eu_taxonomy_objective?: string | null
          id?: string
          lifetime_reduction_tonnes?: number | null
          project_id: string
          renewable_share_pct?: number | null
          sfdr_article?: number | null
          updated_at?: string
        }
        Update: {
          co2_tonnes_per_year?: number | null
          created_at?: string
          equivalent_cars?: number | null
          eu_taxonomy_aligned?: boolean | null
          eu_taxonomy_objective?: string | null
          id?: string
          lifetime_reduction_tonnes?: number | null
          project_id?: string
          renewable_share_pct?: number | null
          sfdr_article?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_profile_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist_item: {
        Row: {
          added_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_item_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_question: {
        Args: { _question_id: string; _user_id: string }
        Returns: boolean
      }
      financial_summary_is_listed: {
        Args: { _fs_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_document: {
        Args: { _document_id: string; _user_id: string }
        Returns: boolean
      }
      owns_financial_summary: {
        Args: { _fs_id: string; _user_id: string }
        Returns: boolean
      }
      owns_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      owns_sustainability: {
        Args: { _sp_id: string; _user_id: string }
        Returns: boolean
      }
      project_is_listed: { Args: { _project_id: string }; Returns: boolean }
      sustainability_is_listed: { Args: { _sp_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "developer" | "investor" | "advisor"
      deal_stage:
        | "interest_logged"
        | "data_room"
        | "due_diligence"
        | "term_sheet"
        | "financial_close"
      developer_type:
        | "utility"
        | "municipality"
        | "private_developer"
        | "energy_company"
        | "esco"
        | "other"
      document_access: "public" | "gated"
      investment_range:
        | "under_1m"
        | "1m_5m"
        | "5m_25m"
        | "25m_100m"
        | "over_100m"
      investor_type:
        | "fund"
        | "family_office"
        | "corporate"
        | "individual"
        | "other"
      lifecycle_stage:
        | "concept"
        | "pre_feasibility"
        | "feasibility"
        | "development"
        | "ready_to_build"
        | "due_diligence"
        | "construction"
        | "commissioning"
        | "operational"
      milestone_status: "completed" | "in_progress" | "upcoming"
      project_stage:
        | "concept"
        | "feasibility"
        | "development"
        | "construction"
        | "operational"
      project_type: "greenfield" | "brownfield" | "expansion" | "modernisation"
      project_visibility: "draft" | "listed" | "archived"
      request_status: "requested" | "approved" | "denied" | "withdrawn"
      risk_severity: "low" | "medium" | "high"
      technology:
        | "geothermal"
        | "biomass_chp"
        | "waste_heat_recovery"
        | "solar_thermal"
        | "large_heat_pump"
        | "river_water_cooling"
        | "seawater_cooling"
        | "thermal_storage"
        | "hybrid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "developer", "investor", "advisor"],
      deal_stage: [
        "interest_logged",
        "data_room",
        "due_diligence",
        "term_sheet",
        "financial_close",
      ],
      developer_type: [
        "utility",
        "municipality",
        "private_developer",
        "energy_company",
        "esco",
        "other",
      ],
      document_access: ["public", "gated"],
      investment_range: [
        "under_1m",
        "1m_5m",
        "5m_25m",
        "25m_100m",
        "over_100m",
      ],
      investor_type: [
        "fund",
        "family_office",
        "corporate",
        "individual",
        "other",
      ],
      lifecycle_stage: [
        "concept",
        "pre_feasibility",
        "feasibility",
        "development",
        "ready_to_build",
        "due_diligence",
        "construction",
        "commissioning",
        "operational",
      ],
      milestone_status: ["completed", "in_progress", "upcoming"],
      project_stage: [
        "concept",
        "feasibility",
        "development",
        "construction",
        "operational",
      ],
      project_type: ["greenfield", "brownfield", "expansion", "modernisation"],
      project_visibility: ["draft", "listed", "archived"],
      request_status: ["requested", "approved", "denied", "withdrawn"],
      risk_severity: ["low", "medium", "high"],
      technology: [
        "geothermal",
        "biomass_chp",
        "waste_heat_recovery",
        "solar_thermal",
        "large_heat_pump",
        "river_water_cooling",
        "seawater_cooling",
        "thermal_storage",
        "hybrid",
      ],
    },
  },
} as const
