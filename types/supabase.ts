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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      Address: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          phone_number: string | null
          postal_code: string
          state_province: string
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          phone_number?: string | null
          postal_code: string
          state_province: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          phone_number?: string | null
          postal_code?: string
          state_province?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Address_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      Agent: {
        Row: {
          address_line1: string
          address_line2: string | null
          capacity: number
          city: string
          country: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          operating_hours: string | null
          phone_number: string
          postal_code: string
          state_province: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          capacity?: number
          city: string
          country: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          operating_hours?: string | null
          phone_number: string
          postal_code: string
          state_province: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          capacity?: number
          city?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          operating_hours?: string | null
          phone_number?: string
          postal_code?: string
          state_province?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Agent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Cart: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Cart_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      CartItem: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "CartItem_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "Cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CartItem_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Category: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_value: number
          expiry_date: string | null
          id: string
          is_active: boolean
          min_purchase_amount: number | null
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_value: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          min_purchase_amount?: number | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_value?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          min_purchase_amount?: number | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: []
      }
      Coupon: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expiry_date: string | null
          id: string
          is_active: boolean
          min_purchase_amount: number | null
          product_id: string | null
          starts_at: string | null
          updated_at: string
          usage_count: number
          usage_limit: number | null
          vendor_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          min_purchase_amount?: number | null
          product_id?: string | null
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          vendor_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          min_purchase_amount?: number | null
          product_id?: string | null
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Coupon_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Coupon_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      Customer: {
        Row: {
          created_at: string
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Customer_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      HeroBanner: {
        Row: {
          buttonLink: string | null
          buttonText: string | null
          createdAt: string | null
          endDate: string | null
          id: string
          imagePublicId: string | null
          imageUrl: string
          isActive: boolean | null
          mobileImagePublicId: string | null
          mobileImageUrl: string | null
          priority: number | null
          startDate: string | null
          subtitle: string | null
          title: string
          updatedAt: string | null
        }
        Insert: {
          buttonLink?: string | null
          buttonText?: string | null
          createdAt?: string | null
          endDate?: string | null
          id?: string
          imagePublicId?: string | null
          imageUrl: string
          isActive?: boolean | null
          mobileImagePublicId?: string | null
          mobileImageUrl?: string | null
          priority?: number | null
          startDate?: string | null
          subtitle?: string | null
          title: string
          updatedAt?: string | null
        }
        Update: {
          buttonLink?: string | null
          buttonText?: string | null
          createdAt?: string | null
          endDate?: string | null
          id?: string
          imagePublicId?: string | null
          imageUrl?: string
          isActive?: boolean | null
          mobileImagePublicId?: string | null
          mobileImageUrl?: string | null
          priority?: number | null
          startDate?: string | null
          subtitle?: string | null
          title?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      Notification: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          reference_url: string | null
          return_id: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          reference_url?: string | null
          return_id?: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          reference_url?: string | null
          return_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "Return"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      NotificationPreference: {
        Row: {
          channel: Database["public"]["Enums"]["NotificationChannel"]
          created_at: string
          enabled: boolean
          id: string
          type: Database["public"]["Enums"]["NotificationType"]
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["NotificationChannel"]
          created_at?: string
          enabled?: boolean
          id?: string
          type: Database["public"]["Enums"]["NotificationType"]
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["NotificationChannel"]
          created_at?: string
          enabled?: boolean
          id?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "NotificationPreference_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Order: {
        Row: {
          actual_pickup_date: string | null
          agent_id: string | null
          billing_address_id: string | null
          coupon_id: string | null
          created_at: string
          customer_id: string
          discount_amount: number
          dropoff_code: string | null
          estimated_pickup_date: string | null
          id: string
          order_group_id: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["PaymentStatus"]
          pickup_code: string | null
          pickup_status: Database["public"]["Enums"]["PickupStatus"]
          shipping_address_id: string | null
          shipping_amount: number
          short_id: string | null
          status: Database["public"]["Enums"]["OrderStatus"]
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_pickup_date?: string | null
          agent_id?: string | null
          billing_address_id?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id: string
          discount_amount?: number
          dropoff_code?: string | null
          estimated_pickup_date?: string | null
          id?: string
          order_group_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["PaymentStatus"]
          pickup_code?: string | null
          pickup_status?: Database["public"]["Enums"]["PickupStatus"]
          shipping_address_id?: string | null
          shipping_amount?: number
          short_id?: string | null
          status?: Database["public"]["Enums"]["OrderStatus"]
          subtotal: number
          tax_amount?: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          actual_pickup_date?: string | null
          agent_id?: string | null
          billing_address_id?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string
          discount_amount?: number
          dropoff_code?: string | null
          estimated_pickup_date?: string | null
          id?: string
          order_group_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["PaymentStatus"]
          pickup_code?: string | null
          pickup_status?: Database["public"]["Enums"]["PickupStatus"]
          shipping_address_id?: string | null
          shipping_amount?: number
          short_id?: string | null
          status?: Database["public"]["Enums"]["OrderStatus"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Order_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "Agent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "Address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "Coupon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_order_group_id_fkey"
            columns: ["order_group_id"]
            isOneToOne: false
            referencedRelation: "OrderGroup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "Address"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderGroup: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrderGroup_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderItem: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["OrderItemStatus"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
          status?: Database["public"]["Enums"]["OrderItemStatus"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["OrderItemStatus"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrderItem_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      Payout: {
        Row: {
          amount: number
          approved_amount: number | null
          approved_at: string | null
          approved_by: string | null
          bank_details: Json | null
          created_at: string
          id: string
          notes: string | null
          reference_id: string | null
          rejection_reason: string | null
          request_amount: number | null
          status: Database["public"]["Enums"]["PayoutStatus"]
          transaction_date: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount: number
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          rejection_reason?: string | null
          request_amount?: number | null
          status?: Database["public"]["Enums"]["PayoutStatus"]
          transaction_date?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          rejection_reason?: string | null
          request_amount?: number | null
          status?: Database["public"]["Enums"]["PayoutStatus"]
          transaction_date?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Payout_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Payout_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      PayoutHold: {
        Row: {
          created_at: string | null
          created_by: string | null
          hold_amount: number
          id: string
          payout_id: string | null
          reason: string
          refund_request_ids: string[] | null
          released_at: string | null
          status: Database["public"]["Enums"]["payoutholdstatus"] | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          hold_amount: number
          id?: string
          payout_id?: string | null
          reason: string
          refund_request_ids?: string[] | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payoutholdstatus"] | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          hold_amount?: number
          id?: string
          payout_id?: string | null
          reason?: string
          refund_request_ids?: string[] | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["payoutholdstatus"] | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "PayoutHold_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PayoutHold_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "Payout"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PayoutHold_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      PayoutSettings: {
        Row: {
          auto_approval_limit: number | null
          created_at: string | null
          id: string
          maximum_payout_amount: number | null
          minimum_payout_amount: number | null
          payout_schedule: string | null
          processing_fee_fixed: number | null
          processing_fee_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          auto_approval_limit?: number | null
          created_at?: string | null
          id?: string
          maximum_payout_amount?: number | null
          minimum_payout_amount?: number | null
          payout_schedule?: string | null
          processing_fee_fixed?: number | null
          processing_fee_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_approval_limit?: number | null
          created_at?: string | null
          id?: string
          maximum_payout_amount?: number | null
          minimum_payout_amount?: number | null
          payout_schedule?: string | null
          processing_fee_fixed?: number | null
          processing_fee_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      Product: {
        Row: {
          category_id: string
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          inventory: number
          is_published: boolean
          name: string
          price: number
          slug: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category_id: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          inventory?: number
          is_published?: boolean
          name: string
          price: number
          slug: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category_id?: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          inventory?: number
          is_published?: boolean
          name?: string
          price?: number
          slug?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Product_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Product_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductImage: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          product_id: string
          updated_at: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          updated_at?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProductImage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      RefundRequest: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          order_id: string
          order_item_id: string
          photos: Json | null
          reason: string
          refund_amount: number
          return_id: string | null
          status: Database["public"]["Enums"]["refundrequeststatus"] | null
          updated_at: string | null
          vendor_id: string
          vendor_response: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          order_id: string
          order_item_id: string
          photos?: Json | null
          reason: string
          refund_amount: number
          return_id?: string | null
          status?: Database["public"]["Enums"]["refundrequeststatus"] | null
          updated_at?: string | null
          vendor_id: string
          vendor_response?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          order_id?: string
          order_item_id?: string
          photos?: Json | null
          reason?: string
          refund_amount?: number
          return_id?: string | null
          status?: Database["public"]["Enums"]["refundrequeststatus"] | null
          updated_at?: string | null
          vendor_id?: string
          vendor_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "RefundRequest_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RefundRequest_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RefundRequest_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "OrderItem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RefundRequest_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "Return"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RefundRequest_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      Return: {
        Row: {
          admin_override: boolean | null
          admin_override_reason: string | null
          agent_id: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string
          order_item_id: string
          photos: Json | null
          process_date: string | null
          product_id: string
          reason: string
          refund_amount: number
          refund_status: Database["public"]["Enums"]["RefundStatus"]
          request_date: string
          status: Database["public"]["Enums"]["ReturnStatus"]
          updated_at: string
          vendor_decision: string | null
          vendor_decision_date: string | null
          vendor_id: string
        }
        Insert: {
          admin_override?: boolean | null
          admin_override_reason?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          order_item_id: string
          photos?: Json | null
          process_date?: string | null
          product_id: string
          reason: string
          refund_amount: number
          refund_status?: Database["public"]["Enums"]["RefundStatus"]
          request_date?: string
          status?: Database["public"]["Enums"]["ReturnStatus"]
          updated_at?: string
          vendor_decision?: string | null
          vendor_decision_date?: string | null
          vendor_id: string
        }
        Update: {
          admin_override?: boolean | null
          admin_override_reason?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          order_item_id?: string
          photos?: Json | null
          process_date?: string | null
          product_id?: string
          reason?: string
          refund_amount?: number
          refund_status?: Database["public"]["Enums"]["RefundStatus"]
          request_date?: string
          status?: Database["public"]["Enums"]["ReturnStatus"]
          updated_at?: string
          vendor_decision?: string | null
          vendor_decision_date?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Return_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "Agent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "OrderItem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      Review: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string | null
          product_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id?: string | null
          product_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          product_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Review_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      ReviewResponse: {
        Row: {
          created_at: string
          id: string
          response_text: string
          review_id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_text: string
          review_id: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response_text?: string
          review_id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ReviewResponse_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "Review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ReviewResponse_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      SpecialOffer: {
        Row: {
          buttonlink: string | null
          buttontext: string | null
          createdat: string
          discountcode: string | null
          discountdescription: string | null
          discounttype: string
          discountvalue: number
          enddate: string | null
          id: string
          isactive: boolean
          priority: number
          startdate: string | null
          subtitle: string | null
          title: string
          updatedat: string
        }
        Insert: {
          buttonlink?: string | null
          buttontext?: string | null
          createdat?: string
          discountcode?: string | null
          discountdescription?: string | null
          discounttype?: string
          discountvalue?: number
          enddate?: string | null
          id?: string
          isactive?: boolean
          priority?: number
          startdate?: string | null
          subtitle?: string | null
          title: string
          updatedat?: string
        }
        Update: {
          buttonlink?: string | null
          buttontext?: string | null
          createdat?: string
          discountcode?: string | null
          discountdescription?: string | null
          discounttype?: string
          discountvalue?: number
          enddate?: string | null
          id?: string
          isactive?: boolean
          priority?: number
          startdate?: string | null
          subtitle?: string | null
          title?: string
          updatedat?: string
        }
        Relationships: []
      }
      User: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["UserRole"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updated_at?: string
        }
        Relationships: []
      }
      Vendor: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          banner_url: string | null
          commission_rate: number
          created_at: string
          description: string | null
          id: string
          is_approved: boolean
          logo_url: string | null
          store_name: string
          total_refund_amount: number | null
          total_refunds_processed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          banner_url?: string | null
          commission_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          is_approved?: boolean
          logo_url?: string | null
          store_name: string
          total_refund_amount?: number | null
          total_refunds_processed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          banner_url?: string | null
          commission_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          is_approved?: boolean
          logo_url?: string | null
          store_name?: string
          total_refund_amount?: number | null
          total_refunds_processed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Vendor_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Wishlist: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Wishlist_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      WishlistItem: {
        Row: {
          created_at: string
          id: string
          product_id: string
          updated_at: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "WishlistItem_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WishlistItem_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "Wishlist"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      UserUnreadNotificationCount: {
        Row: {
          unread_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_set_user_role: {
        Args: { p_vendor_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      discount_type: "PERCENTAGE" | "FIXED_AMOUNT"
      NotificationChannel: "IN_APP" | "PUSH"
      NotificationType:
        | "ORDER_STATUS_CHANGE"
        | "PICKUP_READY"
        | "ORDER_PICKED_UP"
        | "RETURN_REQUESTED"
        | "RETURN_APPROVED"
        | "RETURN_REJECTED"
        | "REFUND_PROCESSED"
        | "PAYMENT_FAILED"
        | "ORDER_SHIPPED"
        | "ORDER_DELIVERED"
        | "NEW_ORDER_VENDOR"
        | "RETURN_VENDOR_ACTION_REQUIRED"
        | "RETURN_VENDOR_COMPLETED"
        | "PAYOUT_PROCESSED"
        | "NEW_PICKUP_ASSIGNMENT"
        | "RETURN_PICKUP_ASSIGNMENT"
        | "NEW_VENDOR_APPLICATION"
        | "HIGH_VALUE_ORDER_ALERT"
        | "LOW_STOCK_ALERT"
        | "COUPON_CREATED"
        | "COUPON_EXPIRED"
        | "COUPON_USAGE_THRESHOLD"
        | "COUPON_APPLIED"
        | "COUPON_FAILED"
        | "PRODUCT_BACK_IN_STOCK"
        | "PRODUCT_PRICE_DROP"
        | "WISHLIST_REMINDER"
        | "NEW_PRODUCT_REVIEW"
        | "REVIEW_RESPONSE"
        | "REVIEW_MILESTONE"
        | "COMMISSION_RATE_CHANGED"
        | "PAYOUT_ON_HOLD"
        | "PAYOUT_HOLD_RELEASED"
        | "MINIMUM_PAYOUT_REACHED"
        | "POPULAR_PRODUCT_ALERT"
        | "AGENT_LOCATION_NAME_UPDATE"
        | "ACCOUNT_VERIFICATION"
        | "PASSWORD_RESET"
        | "SECURITY_ALERT"
        | "MAINTENANCE_NOTICE"
        | "PAYMENT_RECEIVED"
        | "PAYOUT_REQUEST"
      OrderItemStatus:
        | "PENDING"
        | "PROCESSING"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
      OrderStatus:
        | "PENDING"
        | "PROCESSING"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
        | "READY_FOR_PICKUP"
      PaymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      payoutholdstatus: "ACTIVE" | "RELEASED" | "EXPIRED"
      PayoutStatus: "PENDING" | "COMPLETED" | "FAILED"
      PickupStatus: "PENDING" | "READY_FOR_PICKUP" | "PICKED_UP"
      refundrequeststatus:
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | "PROCESSING"
        | "COMPLETED"
        | "CANCELLED"
      RefundStatus: "PENDING" | "PROCESSED" | "REJECTED"
      ReturnStatus: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED"
      UserRole: "ADMIN" | "CUSTOMER" | "VENDOR" | "AGENT"
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
  public: {
    Enums: {
      discount_type: ["PERCENTAGE", "FIXED_AMOUNT"],
      NotificationChannel: ["IN_APP", "PUSH"],
      NotificationType: [
        "ORDER_STATUS_CHANGE",
        "PICKUP_READY",
        "ORDER_PICKED_UP",
        "RETURN_REQUESTED",
        "RETURN_APPROVED",
        "RETURN_REJECTED",
        "REFUND_PROCESSED",
        "PAYMENT_FAILED",
        "ORDER_SHIPPED",
        "ORDER_DELIVERED",
        "NEW_ORDER_VENDOR",
        "RETURN_VENDOR_ACTION_REQUIRED",
        "RETURN_VENDOR_COMPLETED",
        "PAYOUT_PROCESSED",
        "NEW_PICKUP_ASSIGNMENT",
        "RETURN_PICKUP_ASSIGNMENT",
        "NEW_VENDOR_APPLICATION",
        "HIGH_VALUE_ORDER_ALERT",
        "LOW_STOCK_ALERT",
        "COUPON_CREATED",
        "COUPON_EXPIRED",
        "COUPON_USAGE_THRESHOLD",
        "COUPON_APPLIED",
        "COUPON_FAILED",
        "PRODUCT_BACK_IN_STOCK",
        "PRODUCT_PRICE_DROP",
        "WISHLIST_REMINDER",
        "NEW_PRODUCT_REVIEW",
        "REVIEW_RESPONSE",
        "REVIEW_MILESTONE",
        "COMMISSION_RATE_CHANGED",
        "PAYOUT_ON_HOLD",
        "PAYOUT_HOLD_RELEASED",
        "MINIMUM_PAYOUT_REACHED",
        "POPULAR_PRODUCT_ALERT",
        "AGENT_LOCATION_NAME_UPDATE",
        "ACCOUNT_VERIFICATION",
        "PASSWORD_RESET",
        "SECURITY_ALERT",
        "MAINTENANCE_NOTICE",
        "PAYMENT_RECEIVED",
        "PAYOUT_REQUEST",
      ],
      OrderItemStatus: [
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      OrderStatus: [
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "READY_FOR_PICKUP",
      ],
      PaymentStatus: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      payoutholdstatus: ["ACTIVE", "RELEASED", "EXPIRED"],
      PayoutStatus: ["PENDING", "COMPLETED", "FAILED"],
      PickupStatus: ["PENDING", "READY_FOR_PICKUP", "PICKED_UP"],
      refundrequeststatus: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "PROCESSING",
        "COMPLETED",
        "CANCELLED",
      ],
      RefundStatus: ["PENDING", "PROCESSED", "REJECTED"],
      ReturnStatus: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"],
      UserRole: ["ADMIN", "CUSTOMER", "VENDOR", "AGENT"],
    },
  },
} as const
