/**
 * Database types for Supabase.
 *
 * Generated from schema, but kept as TypeScript for now since we don't have
 * the Supabase CLI set up yet. When you run `supabase gen types typescript`,
 * this file gets replaced with the actual schema types.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
          premium_tier: 'free' | 'plus' | 'family';
          encrypted_data: string | null;
        };
        Insert: Omit<Database['public']['Tables']['families']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['families']['Insert']>;
      };
      parents: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          label: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['parents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['parents']['Insert']>;
      };
      sync_metadata: {
        Row: {
          id: string;
          family_id: string;
          version: number;
          last_sync_at: string;
          device_id: string;
          checksum: string;
        };
        Insert: Omit<Database['public']['Tables']['sync_metadata']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['sync_metadata']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
