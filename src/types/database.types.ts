export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Functions: {
      create_customer_order: {
        Args: {
          p_table_slug: string
          p_session_token: string
          p_request_id: string
          p_notes: string
          p_items: unknown
        }
        Returns: unknown
      }
      transition_order_status: {
        Args: {
          p_order_id: string
          p_expected_status: Database['public']['Tables']['orders']['Row']['status']
          p_new_status: Database['public']['Tables']['orders']['Row']['status']
          p_reason?: string | null
          p_metadata?: Json
        }
        Returns: Json
      }
      create_cashier_order: {
        Args: {
          p_idempotency_key: string
          p_items: Json
          p_table_id?: string | null
          p_customer_name?: string | null
          p_notes?: string | null
          p_fulfillment_type?: Database['public']['Tables']['orders']['Row']['fulfillment_type']
          p_dining_session_id?: string | null
        }
        Returns: Json
      }
      record_order_payment: {
        Args: {
          p_order_id: string
          p_provider: string
          p_provider_transaction_id: string
          p_amount: number
          p_status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELED' | 'REFUNDED'
          p_paid_at: string | null
          p_raw: unknown
          p_payment_session_id?: string | null
          p_reference_id?: string | null
          p_payment_request_id?: string | null
          p_payment_id?: string | null
          p_payment_method?: string | null
          p_payment_channel?: string | null
          p_expires_at?: string | null
          p_canceled_at?: string | null
        }
        Returns: unknown
      }
      confirm_cashier_payment: {
        Args: {
          p_idempotency_key: string
          p_method: 'CASH' | 'QRIS'
          p_order_id?: string | null
          p_dining_session_id?: string | null
          p_tendered_amount?: number | null
          p_cashier_metadata?: Json
        }
        Returns: Json
      }
      complete_dining_session: {
        Args: {
          p_dining_session_id: string
          p_idempotency_key: string
        }
        Returns: Json
      }
      record_receipt_print_attempt: {
        Args: {
          p_receipt_id: string
          p_status: 'REQUESTED' | 'SUCCEEDED' | 'FAILED'
          p_printer_metadata?: Json | null
          p_error_message?: string | null
        }
        Returns: string
      }
      get_dining_session_summary: {
        Args: {
          p_table_slug: string
          p_session_token: string
        }
        Returns: Json
      }
      start_or_resume_dining_session: {
        Args: {
          p_table_slug: string
          p_create_if_missing?: boolean
        }
        Returns: unknown
      }
      get_table_session_status: {
        Args: {
          p_table_slug: string
        }
        Returns: unknown
      }
      validate_dining_session: {
        Args: {
          p_table_slug: string
          p_session_token: string
        }
        Returns: unknown
      }
      get_order_tracking: {
        Args: {
          p_table_slug: string
          p_session_token: string
          p_order_number: string
        }
        Returns: unknown
      }
      get_financial_summary: {
        Args: {
          p_start: string
          p_end: string
        }
        Returns: unknown
      }
      get_realized_revenue: {
        Args: {
          p_start: string
          p_end: string
        }
        Returns: number
      }
    }
    Views: {
      [_ in never]: never
    }
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          role: 'staff' | 'kitchen' | 'admin' | 'owner'
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & { created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      products: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          description: string | null
          product_type: 'CAFE_DRINK' | 'FOOD' | 'PASTRY' | 'COFFEE_BEAN' | 'DESSERT' | 'SERVICE'
          base_price: number
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          price: number
          is_default: boolean
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
      }
      product_options: {
        Row: {
          id: string
          product_id: string
          name: string
          is_required: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_options']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['product_options']['Insert']>
      }
      product_option_values: {
        Row: {
          id: string
          product_option_id: string
          name: string
          price_adjustment: number
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_option_values']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['product_option_values']['Insert']>
      }
      tables: {
        Row: {
          id: string
          table_number: string
          name: string | null
          slug: string
          capacity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tables']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['tables']['Insert']>
      }
      coffee_origins: {
        Row: {
          id: string
          country: string
          region: string | null
          farm: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['coffee_origins']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['coffee_origins']['Insert']>
      }
      coffee_products: {
        Row: {
          id: string
          product_id: string
          origin_id: string | null
          process: string | null
          roast_level: string | null
          altitude_min: number | null
          altitude_max: number | null
          variety: string | null
          story: string | null
          brewing_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['coffee_products']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['coffee_products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          order_type: 'DINE_IN' | 'TAKEAWAY' | 'ONLINE'
          fulfillment_type: 'TABLE' | 'PICKUP' | 'DELIVERY'
          customer_id: string | null
          table_id: string | null
          dining_session_id: string | null
          subtotal: number
          tax: number
          service_fee: number
          shipping_fee: number
          discount: number
          total: number
          status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED' | 'PENDING_PAYMENT' | 'PENDING' | 'CONFIRMED' | 'COMPLETED'
          customer_name: string | null
          customer_phone: string | null
          shipping_recipient: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_province: string | null
          shipping_postal_code: string | null
          notes: string | null
          client_request_id: string | null
          request_fingerprint: string | null
          source: 'CUSTOMER' | 'CASHIER' | 'LEGACY'
          created_by: string | null
          created_at: string
          updated_at: string
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          coffee_variant_id: string | null
          product_name_snapshot: string
          variant_name_snapshot: string | null
          quantity: number
          unit_price: number
          subtotal: number
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      order_item_options: {
        Row: {
          id: string
          order_item_id: string
          option_name_snapshot: string
          option_value_snapshot: string
          price_adjustment: number
        }
        Insert: Omit<Database['public']['Tables']['order_item_options']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['order_item_options']['Insert']>
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          old_status: string | null
          new_status: string
          changed_by: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_status_history']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['order_status_history']['Insert']>
      }
      coffee_flavor_notes: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['coffee_flavor_notes']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['coffee_flavor_notes']['Insert']>
      }
      coffee_product_flavor_notes: {
        Row: {
          coffee_product_id: string
          flavor_note_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['coffee_product_flavor_notes']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['coffee_product_flavor_notes']['Insert']>
      }
      coffee_variants: {
        Row: {
          id: string
          coffee_product_id: string
          weight_grams: number
          grind_type: string
          price: number
          stock_quantity: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['coffee_variants']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['coffee_variants']['Insert']>
      }
      dining_sessions: {
        Row: {
          id: string
          table_id: string
          session_token: string | null
          status: 'open' | 'closed'
          started_at: string
          closed_at: string | null
          created_at: string
          updated_at: string
          completed_by: string | null
          completion_idempotency_key: string | null
          total_snapshot: number | null
          receipt_snapshot: Json | null
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['dining_sessions']['Row'], 'id' | 'status' | 'started_at' | 'created_at' | 'updated_at' | 'completed_by' | 'completion_idempotency_key' | 'total_snapshot' | 'receipt_snapshot' | 'completed_at'> & {
          id?: string
          status?: 'open' | 'closed'
          started_at?: string
          created_at?: string
          updated_at?: string
          completed_by?: string | null
          completion_idempotency_key?: string | null
          total_snapshot?: number | null
          receipt_snapshot?: Json | null
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['dining_sessions']['Insert']>
      }
      payments: {
        Row: {
          id: string
          order_id: string | null
          dining_session_id: string | null
          provider: string
          provider_transaction_id: string | null
          status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELED' | 'REFUNDED'
          amount: number
          paid_at: string | null
          expired_at: string | null
          raw_response: Json | null
          payment_session_id: string | null
          reference_id: string | null
          payment_request_id: string | null
          payment_id: string | null
          payment_method: string | null
          payment_channel: string | null
          canceled_at: string | null
          cashier_id: string | null
          cashier_metadata: Json | null
          idempotency_key: string | null
          payment_origin: 'XENDIT' | 'PROVIDER' | 'LEGACY_MANUAL' | 'CASHIER'
          confirmed_by: string | null
          confirmed_at: string | null
          cash_received: number | null
          change_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      receipts: {
        Row: {
          id: string
          payment_id: string
          order_id: string | null
          dining_session_id: string | null
          receipt_number: string
          snapshot: Json
          issued_by: string
          issued_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['receipts']['Row'], 'id' | 'issued_at' | 'created_at'> & { id?: string, issued_at?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>
      }
      receipt_print_attempts: {
        Row: {
          id: string
          receipt_id: string
          requested_by: string
          status: 'REQUESTED' | 'SUCCEEDED' | 'FAILED'
          printer_metadata: Json | null
          error_message: string | null
          attempted_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['receipt_print_attempts']['Row'], 'id' | 'status' | 'attempted_at' | 'created_at'> & { id?: string, status?: 'REQUESTED' | 'SUCCEEDED' | 'FAILED', attempted_at?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['receipt_print_attempts']['Insert']>
      }
      payment_webhook_events: {
        Row: {
          id: string
          event_id: string
          event_type: string
          payload: Json
          received_at: string
          processed_at: string | null
          error: string | null
        }
        Insert: Omit<Database['public']['Tables']['payment_webhook_events']['Row'], 'id' | 'received_at'> & { id?: string, received_at?: string }
        Update: Partial<Database['public']['Tables']['payment_webhook_events']['Insert']>
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          title: string
          description: string | null
          amount: number
          category_id: string
          expense_date: string
          payment_method: string
          attachment_url: string | null
          notes: string | null
          status: string
          created_by: string
          voided_at: string | null
          voided_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_by' | 'created_at' | 'updated_at'> & { id?: string, created_by?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      financial_adjustments: {
        Row: {
          id: string
          adjustment_type: string
          amount: number
          order_id: string | null
          effective_date: string
          reason: string
          status: string
          created_by: string
          voided_at: string | null
          voided_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['financial_adjustments']['Row'], 'id' | 'created_by' | 'created_at' | 'updated_at'> & { id?: string, created_by?: string, created_at?: string, updated_at?: string }
        Update: Partial<Database['public']['Tables']['financial_adjustments']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      app_settings: {
        Row: {
          id: number
          business_name: string
          tagline: string
          address: string
          website: string
          wifi_name: string
          wifi_password: string
          footer_message: string
          opening_hours: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['app_settings']['Row'], 'updated_at'> & { updated_at?: string }
        Update: Partial<Database['public']['Tables']['app_settings']['Insert']>
      }
    }
  }
}
