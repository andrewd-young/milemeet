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
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      run_connections: {
        Row: {
          id: string
          inserted_at: string | null
          next_run_at: string | null
          note: string | null
          owner_runner_id: string
          partner_runner_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          inserted_at?: string | null
          next_run_at?: string | null
          note?: string | null
          owner_runner_id: string
          partner_runner_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          inserted_at?: string | null
          next_run_at?: string | null
          note?: string | null
          owner_runner_id?: string
          partner_runner_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'run_connections_owner_runner_id_fkey'
            columns: ['owner_runner_id']
            isOneToOne: false
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'run_connections_partner_runner_id_fkey'
            columns: ['partner_runner_id']
            isOneToOne: false
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
        ]
      }
      runner_integrations: {
        Row: {
          id: string
          runner_id: string
          strava_access_token: string | null
          strava_athlete_id: number | null
          strava_athlete_name: string | null
          strava_refresh_token: string | null
          strava_scope: string | null
          strava_token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          runner_id: string
          strava_access_token?: string | null
          strava_athlete_id?: number | null
          strava_athlete_name?: string | null
          strava_refresh_token?: string | null
          strava_scope?: string | null
          strava_token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          runner_id?: string
          strava_access_token?: string | null
          strava_athlete_id?: number | null
          strava_athlete_name?: string | null
          strava_refresh_token?: string | null
          strava_scope?: string | null
          strava_token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'runner_integrations_runner_id_fkey'
            columns: ['runner_id']
            isOneToOne: true
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
        ]
      }
      runner_messages: {
        Row: {
          body: string
          connection_id: string
          id: string
          sender_runner_id: string
          sent_at: string
        }
        Insert: {
          body: string
          connection_id: string
          id?: string
          sender_runner_id: string
          sent_at?: string
        }
        Update: {
          body?: string
          connection_id?: string
          id?: string
          sender_runner_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'runner_messages_connection_id_fkey'
            columns: ['connection_id']
            isOneToOne: false
            referencedRelation: 'run_connections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'runner_messages_sender_runner_id_fkey'
            columns: ['sender_runner_id']
            isOneToOne: false
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
        ]
      }
      runners: {
        Row: {
          banned: boolean
          bio: string | null
          distance_max: number
          distance_min: number
          goals: string | null
          id: string
          image_name: string | null
          inserted_at: string | null
          instagram: string | null
          linkedin: string | null
          name: string
          neighborhood: string
          other_photos: string[] | null
          pace: number
          past_races: string[] | null
          run_clubs: string[] | null
          run_days: string[] | null
          run_neighborhoods: string[] | null
          run_times: string[] | null
          strava: string | null
          strava_public: boolean
          strava_verified: boolean
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          banned?: boolean
          bio?: string | null
          distance_max: number
          distance_min: number
          goals?: string | null
          id?: string
          image_name?: string | null
          inserted_at?: string | null
          instagram?: string | null
          linkedin?: string | null
          name: string
          neighborhood: string
          other_photos?: string[] | null
          pace: number
          past_races?: string[] | null
          run_clubs?: string[] | null
          run_days?: string[] | null
          run_neighborhoods?: string[] | null
          run_times?: string[] | null
          strava?: string | null
          strava_public?: boolean
          strava_verified?: boolean
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          banned?: boolean
          bio?: string | null
          distance_max?: number
          distance_min?: number
          goals?: string | null
          id?: string
          image_name?: string | null
          inserted_at?: string | null
          instagram?: string | null
          linkedin?: string | null
          name?: string
          neighborhood?: string
          other_photos?: string[] | null
          pace?: number
          past_races?: string[] | null
          run_clubs?: string[] | null
          run_days?: string[] | null
          run_neighborhoods?: string[] | null
          run_times?: string[] | null
          strava?: string | null
          strava_public?: boolean
          strava_verified?: boolean
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_runner_id: string | null
          blocker_runner_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_runner_id?: string | null
          blocker_runner_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_runner_id?: string | null
          blocker_runner_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_blocks_blocked_runner_id_fkey'
            columns: ['blocked_runner_id']
            isOneToOne: false
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_blocks_blocker_runner_id_fkey'
            columns: ['blocker_runner_id']
            isOneToOne: false
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          reported_runner_id: string | null
          reporter_runner_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          reported_runner_id?: string | null
          reporter_runner_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          reported_runner_id?: string | null
          reporter_runner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_reports_reported_runner_id_fkey'
            columns: ['reported_runner_id']
            isOneToOne: false
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_reports_reporter_runner_id_fkey'
            columns: ['reporter_runner_id']
            isOneToOne: false
            referencedRelation: 'runners'
            referencedColumns: ['id']
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
