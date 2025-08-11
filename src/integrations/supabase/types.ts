export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string;
          color: string | null;
          created_at: string;
          currency: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_type: string;
          color?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_type?: string;
          color?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          category_type: string;
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          category_type: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          category_type?: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          created_at: string;
          date: string;
          from_currency: string;
          id: string;
          rate: number;
          to_currency: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          from_currency: string;
          id?: string;
          rate: number;
          to_currency: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          from_currency?: string;
          id?: string;
          rate?: number;
          to_currency?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      investment_market_values: {
        Row: {
          account_id: string | null;
          id: string;
          investment_id: string;
          market_value: number;
          updated_at: string | null;
        };
        Insert: {
          account_id?: string | null;
          id?: string;
          investment_id: string;
          market_value: number;
          updated_at?: string | null;
        };
        Update: {
          account_id?: string | null;
          id?: string;
          investment_id?: string;
          market_value?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "investment_market_values_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_market_values_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investment_summary";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_market_values_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_types: {
        Row: {
          color: string;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color: string;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          created_at: string | null;
          id: string;
          investment_type: string;
          investment_type_id: string | null;
          ticker: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          investment_type: string;
          investment_type_id?: string | null;
          ticker: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          investment_type?: string;
          investment_type_id?: string | null;
          ticker?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investments_investment_type_id_fkey";
            columns: ["investment_type_id"];
            isOneToOne: false;
            referencedRelation: "investment_types";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          base_currency: string;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          base_currency?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          base_currency?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          amount_gbp: number | null;
          category_id: string | null;
          created_at: string;
          currency: string;
          date: string;
          description: string;
          encord_expensable: boolean;
          exchange_rate: number | null;
          family_member_id: string | null;
          id: string;
          investment_id: string | null;
          notes: string | null;
          transaction_type: string;
          trip_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          amount_gbp?: number | null;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          date: string;
          description: string;
          encord_expensable?: boolean;
          exchange_rate?: number | null;
          family_member_id?: string | null;
          id?: string;
          investment_id?: string | null;
          notes?: string | null;
          transaction_type: string;
          trip_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          amount_gbp?: number | null;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          date?: string;
          description?: string;
          encord_expensable?: boolean;
          exchange_rate?: number | null;
          family_member_id?: string | null;
          id?: string;
          investment_id?: string | null;
          notes?: string | null;
          transaction_type?: string;
          trip_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_family_member_id_fkey";
            columns: ["family_member_id"];
            isOneToOne: false;
            referencedRelation: "family_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investment_summary";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trips: {
        Row: {
          created_at: string;
          end_date: string | null;
          id: string;
          name: string;
          start_date: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          name: string;
          start_date?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          name?: string;
          start_date?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      investment_summary: {
        Row: {
          created_at: string | null;
          current_market_value: number | null;
          id: string | null;
          investment_type: string | null;
          market_value_updated_at: string | null;
          ticker: string | null;
          total_invested: number | null;
          transaction_count: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      insert_default_trips: {
        Args: { user_uuid: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
