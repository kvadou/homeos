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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      care_events: {
        Row: {
          cost: number | null
          created_at: string
          home_id: string
          id: string
          item_id: string | null
          note: string | null
          occurred_on: string
          project_id: string | null
          provenance: Json
          title: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          home_id: string
          id?: string
          item_id?: string | null
          note?: string | null
          occurred_on?: string
          project_id?: string | null
          provenance?: Json
          title: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          home_id?: string
          id?: string
          item_id?: string | null
          note?: string | null
          occurred_on?: string
          project_id?: string | null
          provenance?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      care_tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          detail: string | null
          due_on: string | null
          home_id: string
          id: string
          item_id: string | null
          priority: string | null
          provenance: Json
          recurrence: string | null
          season: string | null
          source: string
          status: string
          template_slug: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          detail?: string | null
          due_on?: string | null
          home_id: string
          id?: string
          item_id?: string | null
          priority?: string | null
          provenance?: Json
          recurrence?: string | null
          season?: string | null
          source?: string
          status?: string
          template_slug?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          detail?: string | null
          due_on?: string | null
          home_id?: string
          id?: string
          item_id?: string | null
          priority?: string | null
          provenance?: Json
          recurrence?: string | null
          season?: string | null
          source?: string
          status?: string
          template_slug?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          home_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          home_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          home_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          home_id: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string
          home_id: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          created_at?: string
          home_id?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions: {
        Row: {
          confidence: number | null
          created_at: string
          data: Json
          doc_type: string | null
          error: string | null
          file_id: string
          home_id: string
          id: string
          model: string | null
          raw_text: string | null
          search: unknown
          status: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          data?: Json
          doc_type?: string | null
          error?: string | null
          file_id: string
          home_id: string
          id?: string
          model?: string | null
          raw_text?: string | null
          search?: unknown
          status?: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          data?: Json
          doc_type?: string | null
          error?: string | null
          file_id?: string
          home_id?: string
          id?: string
          model?: string | null
          raw_text?: string | null
          search?: unknown
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extractions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extractions_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      field_provenance: {
        Row: {
          confidence: number | null
          created_at: string
          entity_id: string
          entity_table: string
          extraction_id: string | null
          field: string
          home_id: string
          id: string
          model: string | null
          source_kind: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entity_id: string
          entity_table: string
          extraction_id?: string | null
          field: string
          home_id: string
          id?: string
          model?: string | null
          source_kind: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entity_id?: string
          entity_table?: string
          extraction_id?: string | null
          field?: string
          home_id?: string
          id?: string
          model?: string | null
          source_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_provenance_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_provenance_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          content_hash: string | null
          created_at: string
          extraction_status: string
          home_id: string
          id: string
          item_id: string | null
          meta: Json
          name: string
          project_id: string | null
          storage_path: string
          taken_at: string | null
          type: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          extraction_status?: string
          home_id: string
          id?: string
          item_id?: string | null
          meta?: Json
          name: string
          project_id?: string | null
          storage_path: string
          taken_at?: string | null
          type: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          extraction_status?: string
          home_id?: string
          id?: string
          item_id?: string | null
          meta?: Json
          name?: string
          project_id?: string | null
          storage_path?: string
          taken_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      home_facts: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string
          embedding: string | null
          evidence: Json
          home_id: string
          id: string
          is_current: boolean
          object_value: string | null
          predicate: string | null
          source_extraction_id: string | null
          source_kind: string
          statement: string
          subject_id: string | null
          subject_table: string | null
          superseded_by: string | null
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          evidence?: Json
          home_id: string
          id?: string
          is_current?: boolean
          object_value?: string | null
          predicate?: string | null
          source_extraction_id?: string | null
          source_kind?: string
          statement: string
          subject_id?: string | null
          subject_table?: string | null
          superseded_by?: string | null
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          embedding?: string | null
          evidence?: Json
          home_id?: string
          id?: string
          is_current?: boolean
          object_value?: string | null
          predicate?: string | null
          source_extraction_id?: string | null
          source_kind?: string
          statement?: string
          subject_id?: string | null
          subject_table?: string | null
          superseded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_facts_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_facts_source_extraction_id_fkey"
            columns: ["source_extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_facts_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "home_facts"
            referencedColumns: ["id"]
          },
        ]
      }
      home_members: {
        Row: {
          created_at: string
          home_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          home_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          home_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_members_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          baths: number | null
          beds: number | null
          city: string | null
          created_at: string
          created_by: string
          features: Json
          goals: Json
          id: string
          name: string
          property_type: string | null
          sqft: number | null
          state: string | null
          street: string | null
          updated_at: string
          year_built: number | null
          zip: string | null
        }
        Insert: {
          baths?: number | null
          beds?: number | null
          city?: string | null
          created_at?: string
          created_by: string
          features?: Json
          goals?: Json
          id?: string
          name: string
          property_type?: string | null
          sqft?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          baths?: number | null
          beds?: number | null
          city?: string | null
          created_at?: string
          created_by?: string
          features?: Json
          goals?: Json
          id?: string
          name?: string
          property_type?: string | null
          sqft?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          action: string | null
          basis: string | null
          category: string
          confidence: number | null
          created_at: string
          dedupe_slug: string | null
          detail: string | null
          evidence: Json
          headline: string
          home_id: string
          id: string
          source: string
          source_extraction_id: string | null
          stat: string | null
          status: string
        }
        Insert: {
          action?: string | null
          basis?: string | null
          category: string
          confidence?: number | null
          created_at?: string
          dedupe_slug?: string | null
          detail?: string | null
          evidence?: Json
          headline: string
          home_id: string
          id?: string
          source?: string
          source_extraction_id?: string | null
          stat?: string | null
          status?: string
        }
        Update: {
          action?: string | null
          basis?: string | null
          category?: string
          confidence?: number | null
          created_at?: string
          dedupe_slug?: string | null
          detail?: string | null
          evidence?: Json
          headline?: string
          home_id?: string
          id?: string
          source?: string
          source_extraction_id?: string | null
          stat?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_source_extraction_id_fkey"
            columns: ["source_extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string
          created_at: string
          facts: Json
          home_id: string
          id: string
          installed_on: string | null
          knowledge: Json
          lifespan_years: number | null
          manufacturer: string | null
          model: string | null
          name: string
          room_id: string | null
          serial: string | null
          status: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          facts?: Json
          home_id: string
          id?: string
          installed_on?: string | null
          knowledge?: Json
          lifespan_years?: number | null
          manufacturer?: string | null
          model?: string | null
          name: string
          room_id?: string | null
          serial?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          facts?: Json
          home_id?: string
          id?: string
          installed_on?: string | null
          knowledge?: Json
          lifespan_years?: number | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          room_id?: string | null
          serial?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: Json
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          name?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          completed_year: number | null
          contractor_id: string | null
          cost: number | null
          created_at: string
          home_id: string
          id: string
          kind: string
          metadata: Json
          name: string
          progress: number | null
          spent: number | null
          started_on: string | null
          status: string | null
          summary: string | null
          target_end: string | null
          updated_at: string
          value_added: number | null
        }
        Insert: {
          budget?: number | null
          completed_year?: number | null
          contractor_id?: string | null
          cost?: number | null
          created_at?: string
          home_id: string
          id?: string
          kind?: string
          metadata?: Json
          name: string
          progress?: number | null
          spent?: number | null
          started_on?: string | null
          status?: string | null
          summary?: string | null
          target_end?: string | null
          updated_at?: string
          value_added?: number | null
        }
        Update: {
          budget?: number | null
          completed_year?: number | null
          contractor_id?: string | null
          cost?: number | null
          created_at?: string
          home_id?: string
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          progress?: number | null
          spent?: number | null
          started_on?: string | null
          status?: string | null
          summary?: string | null
          target_end?: string | null
          updated_at?: string
          value_added?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          home_id: string
          id: string
          name: string
          slug: string
          summary: string | null
        }
        Insert: {
          created_at?: string
          home_id: string
          id?: string
          name: string
          slug: string
          summary?: string | null
        }
        Update: {
          created_at?: string
          home_id?: string
          id?: string
          name?: string
          slug?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          action: string
          confidence: number
          created_at: string
          dedupe_key: string
          home_id: string
          id: string
          payload: Json
          provenance: Json
          status: string
          summary: string
          target: string
          target_id: string | null
        }
        Insert: {
          action?: string
          confidence: number
          created_at?: string
          dedupe_key: string
          home_id: string
          id?: string
          payload: Json
          provenance?: Json
          status?: string
          summary: string
          target: string
          target_id?: string | null
        }
        Update: {
          action?: string
          confidence?: number
          created_at?: string
          dedupe_key?: string
          home_id?: string
          id?: string
          payload?: Json
          provenance?: Json
          status?: string
          summary?: string
          target?: string
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          created_at: string
          detail: string | null
          home_id: string
          id: string
          kind: string | null
          provenance: Json
          title: string
          year: number
        }
        Insert: {
          created_at?: string
          detail?: string | null
          home_id: string
          id?: string
          kind?: string | null
          provenance?: Json
          title: string
          year: number
        }
        Update: {
          created_at?: string
          detail?: string | null
          home_id?: string
          id?: string
          kind?: string | null
          provenance?: Json
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          event: string
          home_id: string | null
          id: number
          props: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          home_id?: string | null
          id?: never
          props?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          home_id?: string | null
          id?: never
          props?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warranties: {
        Row: {
          confidence: number | null
          coverage: string | null
          created_at: string
          ends_on: string | null
          extraction_id: string | null
          file_id: string | null
          home_id: string
          id: string
          item_id: string | null
          kind: string | null
          notes: string | null
          provider: string | null
          source_kind: string
          starts_on: string | null
          status: string
          term_months: number | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          coverage?: string | null
          created_at?: string
          ends_on?: string | null
          extraction_id?: string | null
          file_id?: string | null
          home_id: string
          id?: string
          item_id?: string | null
          kind?: string | null
          notes?: string | null
          provider?: string | null
          source_kind?: string
          starts_on?: string | null
          status?: string
          term_months?: number | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          coverage?: string | null
          created_at?: string
          ends_on?: string | null
          extraction_id?: string | null
          file_id?: string | null
          home_id?: string
          id?: string
          item_id?: string | null
          kind?: string | null
          notes?: string | null
          provider?: string | null
          source_kind?: string
          starts_on?: string | null
          status?: string
          term_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_home_member: { Args: { home: string }; Returns: boolean }
      is_home_owner: { Args: { home: string }; Returns: boolean }
      is_home_writer: { Args: { home: string }; Returns: boolean }
      shares_home_with: { Args: { other: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
