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
          p_customer_name: string
          p_notes: string
          p_items: unknown
        }
        Returns: unknown
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
          role: 'staff' | 'kitchen' | 'admin'
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
          product_type: 'CAFE_DRINK' | 'FOOD' | 'PASTRY' | 'COFFEE_BEAN'
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
          order_type: 'DINE_IN' | 'ONLINE'
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
          status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
          customer_name: string | null
          customer_phone: string | null
          shipping_recipient: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_province: string | null
          shipping_postal_code: string | null
          notes: string | null
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
          status: 'open' | 'closed'
        }
      }
    }
  }
}
