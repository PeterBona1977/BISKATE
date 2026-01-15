export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "user" | "admin"
          phone: string | null
          location: string | null
          plan: "free" | "essential" | "pro" | "unlimited"
          responses_used: number
          responses_reset_date: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: "user" | "admin"
          phone?: string | null
          location?: string | null
          plan?: "free" | "essential" | "pro" | "unlimited"
          responses_used?: number
          responses_reset_date?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: "user" | "admin"
          phone?: string | null
          location?: string | null
          plan?: "free" | "essential" | "pro" | "unlimited"
          responses_used?: number
          responses_reset_date?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      gigs: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          price: number
          location: string
          estimated_time: string
          is_premium: boolean
          status: "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled"
          rejection_reason: string | null
          author_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          price: number
          location: string
          estimated_time: string
          is_premium?: boolean
          status?: "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled"
          rejection_reason?: string | null
          author_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          price?: number
          location?: string
          estimated_time?: string
          is_premium?: boolean
          status?: "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled"
          rejection_reason?: string | null
          author_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      gig_responses: {
        Row: {
          id: string
          gig_id: string
          responder_id: string
          created_at: string
        }
        Insert: {
          id?: string
          gig_id: string
          responder_id: string
          created_at?: string
        }
        Update: {
          id?: string
          gig_id?: string
          responder_id?: string
          created_at?: string
        }
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
