/* eslint-disable @typescript-eslint/no-explicit-any -- `Relationships` must be `any[]`; supabase-js typegen requires this exact structural shape on every table. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'customer' | null
          phone: string | null
          auth_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'customer' | null
          phone?: string | null
          auth_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'customer' | null
          phone?: string | null
          auth_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      products: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          description: string | null
          base_price: number
          image_url: string | null
          category: string | null
          category_id: string | null
          is_active: boolean | null
          delivery_fee: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          description?: string | null
          base_price: number
          image_url?: string | null
          category?: string | null
          category_id?: string | null
          is_active?: boolean | null
          delivery_fee?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          base_price?: number
          image_url?: string | null
          category?: string | null
          category_id?: string | null
          is_active?: boolean | null
          delivery_fee?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt: string | null
          sort_order: number | null
          is_hero: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt?: string | null
          sort_order?: number | null
          is_hero?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt?: string | null
          sort_order?: number | null
          is_hero?: boolean | null
          created_at?: string | null
        }
        Relationships: any[]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string | null
          color: string
          size: string
          sku: string
          inventory_count: number | null
          price_adjustment: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          color: string
          size: string
          sku: string
          inventory_count?: number | null
          price_adjustment?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          color?: string
          size?: string
          sku?: string
          inventory_count?: number | null
          price_adjustment?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      custom_designs: {
        Row: {
          id: string
          user_id: string | null
          reference_code: string
          status: 'pending' | 'received' | 'in_review' | 'approved' | 'rejected' | null
          whatsapp_message_id: string | null
          design_image_url: string | null
          notes: string | null
          sender_phone: string | null
          media_url: string | null
          media_mime_type: string | null
          media_caption: string | null
          design_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          reference_code: string
          status?: 'pending' | 'received' | 'in_review' | 'approved' | 'rejected' | null
          whatsapp_message_id?: string | null
          design_image_url?: string | null
          notes?: string | null
          sender_phone?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          media_caption?: string | null
          design_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          reference_code?: string
          status?: 'pending' | 'received' | 'in_review' | 'approved' | 'rejected' | null
          whatsapp_message_id?: string | null
          design_image_url?: string | null
          notes?: string | null
          sender_phone?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          media_caption?: string | null
          design_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          status: 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | null
          total_amount: number
          subtotal_amount: number
          shipping_fee: number
          delivery_fee: number | null
          currency: string
          payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          delivery_mode: string | null
          items_snapshot: Json | null
          customer_email: string | null
          customer_name: string | null
          shipping_address: Json | null
          shipping_address_id: string | null
          payment_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | null
          total_amount: number
          subtotal_amount?: number
          shipping_fee?: number
          delivery_fee?: number | null
          currency?: string
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          delivery_mode?: string | null
          items_snapshot?: Json | null
          customer_email?: string | null
          customer_name?: string | null
          shipping_address?: Json | null
          shipping_address_id?: string | null
          payment_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          status?: 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | null
          total_amount?: number
          subtotal_amount?: number
          shipping_fee?: number
          delivery_fee?: number | null
          currency?: string
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          delivery_mode?: string | null
          items_snapshot?: Json | null
          customer_email?: string | null
          customer_name?: string | null
          shipping_address?: Json | null
          shipping_address_id?: string | null
          payment_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_variant_id: string | null
          custom_design_id: string | null
          quantity: number
          unit_price: number
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_variant_id?: string | null
          custom_design_id?: string | null
          quantity?: number
          unit_price: number
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          product_variant_id?: string | null
          custom_design_id?: string | null
          quantity?: number
          unit_price?: number
          created_at?: string | null
        }
        Relationships: any[]
      }
      addresses: {
        Row: {
          id: string
          user_id: string | null
          label: string | null
          full_name: string | null
          phone: string | null
          line1: string
          line2: string | null
          city: string
          state: string | null
          postal_code: string | null
          country: string
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          label?: string | null
          full_name?: string | null
          phone?: string | null
          line1: string
          line2?: string | null
          city: string
          state?: string | null
          postal_code?: string | null
          country?: string
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          label?: string | null
          full_name?: string | null
          phone?: string | null
          line1?: string
          line2?: string | null
          city?: string
          state?: string | null
          postal_code?: string | null
          country?: string
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      payments: {
        Row: {
          id: string
          order_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          amount: number
          currency: string
          status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded'
          event_id: string | null
          method: string | null
          paid_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded'
          event_id?: string | null
          method?: string | null
          paid_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded'
          event_id?: string | null
          method?: string | null
          paid_at?: string | null
          created_at?: string | null
        }
        Relationships: any[]
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          order_id: string
          user_id: string | null
          subtotal: number
          delivery_fee: number
          total: number
          currency: string
          status: 'paid' | 'refunded' | 'void'
          gst_percent: number
          gst_amount: number
          items_snapshot: Json | null
          billing_address: Json | null
          issued_at: string | null
        }
        Insert: {
          id?: string
          invoice_number: string
          order_id: string
          user_id?: string | null
          subtotal: number
          delivery_fee?: number
          total: number
          currency?: string
          status?: 'paid' | 'refunded' | 'void'
          gst_percent?: number
          gst_amount?: number
          items_snapshot?: Json | null
          billing_address?: Json | null
          issued_at?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          order_id?: string
          user_id?: string | null
          subtotal?: number
          delivery_fee?: number
          total?: number
          currency?: string
          status?: 'paid' | 'refunded' | 'void'
          gst_percent?: number
          gst_amount?: number
          items_snapshot?: Json | null
          billing_address?: Json | null
          issued_at?: string | null
        }
        Relationships: any[]
      }
      delivery_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: any[]
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          order_id: string | null
          rating: number
          comment: string | null
          is_visible: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          order_id?: string | null
          rating: number
          comment?: string | null
          is_visible?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          order_id?: string | null
          rating?: number
          comment?: string | null
          is_visible?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: any[]
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          page_url: string | null
          session_id: string | null
          user_id: string | null
          product_id: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          event_type: string
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
          product_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
          product_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: any[]
      }
      whatsapp_logs: {
        Row: {
          id: string
          direction: 'inbound' | 'outbound'
          wa_message_id: string | null
          from_number: string | null
          to_number: string | null
          message_type: string | null
          body: string | null
          media_id: string | null
          media_url: string | null
          status: string | null
          custom_design_id: string | null
          payload: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          direction: 'inbound' | 'outbound'
          wa_message_id?: string | null
          from_number?: string | null
          to_number?: string | null
          message_type?: string | null
          body?: string | null
          media_id?: string | null
          media_url?: string | null
          status?: string | null
          custom_design_id?: string | null
          payload?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          direction?: 'inbound' | 'outbound'
          wa_message_id?: string | null
          from_number?: string | null
          to_number?: string | null
          message_type?: string | null
          body?: string | null
          media_id?: string | null
          media_url?: string | null
          status?: string | null
          custom_design_id?: string | null
          payload?: Json | null
          created_at?: string | null
        }
        Relationships: any[]
      }
      audit_logs: {
        Row: {
          id: string
          actor_user_id: string | null
          actor_role: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          before: Json | null
          after: Json | null
          ip: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          actor_user_id?: string | null
          actor_role?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          before?: Json | null
          after?: Json | null
          ip?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          actor_user_id?: string | null
          actor_role?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          before?: Json | null
          after?: Json | null
          ip?: string | null
          created_at?: string | null
        }
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_inventory: {
        Args: {
          variant_id: string
          quantity: number
        }
        Returns: {
          success: boolean
          stock_remaining: number | null
        }[]
      }
      restock_inventory: {
        Args: {
          variant_id: string
          quantity: number
        }
        Returns: undefined
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
