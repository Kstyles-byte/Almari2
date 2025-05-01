export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Agent: {
        Row: {
          capacity: number
          createdAt: string
          email: string
          id: string
          isActive: boolean
          location: string
          name: string
          operatingHours: string | null
          phone: string
          updatedAt: string
          userId: string
        }
        Insert: {
          capacity?: number
          createdAt?: string
          email: string
          id: string
          isActive?: boolean
          location: string
          name: string
          operatingHours?: string | null
          phone: string
          updatedAt?: string
          userId: string
        }
        Update: {
          capacity?: number
          createdAt?: string
          email?: string
          id?: string
          isActive?: boolean
          location?: string
          name?: string
          operatingHours?: string | null
          phone?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Agent_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Cart: {
        Row: {
          createdAt: string
          customerId: string
          id: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          customerId: string
          id: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          customerId?: string
          id?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Cart_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      CartItem: {
        Row: {
          cartId: string
          id: string
          productId: string
          quantity: number
        }
        Insert: {
          cartId: string
          id: string
          productId: string
          quantity: number
        }
        Update: {
          cartId?: string
          id?: string
          productId?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "CartItem_cartId_fkey"
            columns: ["cartId"]
            isOneToOne: false
            referencedRelation: "Cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CartItem_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Category: {
        Row: {
          createdAt: string
          icon: string | null
          id: string
          name: string
          parentId: string | null
          slug: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          icon?: string | null
          id: string
          name: string
          parentId?: string | null
          slug: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          icon?: string | null
          id?: string
          name?: string
          parentId?: string | null
          slug?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Category_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
        ]
      }
      Customer: {
        Row: {
          address: string | null
          college: string | null
          createdAt: string
          hostel: string | null
          id: string
          phone: string | null
          room: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          address?: string | null
          college?: string | null
          createdAt?: string
          hostel?: string | null
          id: string
          phone?: string | null
          room?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          address?: string | null
          college?: string | null
          createdAt?: string
          hostel?: string | null
          id?: string
          phone?: string | null
          room?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Customer_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
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
          imageUrl: string
          isActive: boolean | null
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
          imageUrl: string
          isActive?: boolean | null
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
          imageUrl?: string
          isActive?: boolean | null
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
          createdAt: string
          id: string
          isRead: boolean
          message: string
          orderId: string | null
          returnId: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Insert: {
          createdAt?: string
          id: string
          isRead?: boolean
          message: string
          orderId?: string | null
          returnId?: string | null
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          isRead?: boolean
          message?: string
          orderId?: string | null
          returnId?: string | null
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_returnId_fkey"
            columns: ["returnId"]
            isOneToOne: false
            referencedRelation: "Return"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Order: {
        Row: {
          agentId: string | null
          createdAt: string
          customerId: string
          id: string
          paymentReference: string | null
          paymentStatus: Database["public"]["Enums"]["PaymentStatus"]
          pickupCode: string | null
          pickupDate: string | null
          pickupStatus: Database["public"]["Enums"]["PickupStatus"]
          shippingAddress: string | null
          status: Database["public"]["Enums"]["OrderStatus"]
          total: number
          updatedAt: string
        }
        Insert: {
          agentId?: string | null
          createdAt?: string
          customerId: string
          id: string
          paymentReference?: string | null
          paymentStatus?: Database["public"]["Enums"]["PaymentStatus"]
          pickupCode?: string | null
          pickupDate?: string | null
          pickupStatus?: Database["public"]["Enums"]["PickupStatus"]
          shippingAddress?: string | null
          status?: Database["public"]["Enums"]["OrderStatus"]
          total: number
          updatedAt?: string
        }
        Update: {
          agentId?: string | null
          createdAt?: string
          customerId?: string
          id?: string
          paymentReference?: string | null
          paymentStatus?: Database["public"]["Enums"]["PaymentStatus"]
          pickupCode?: string | null
          pickupDate?: string | null
          pickupStatus?: Database["public"]["Enums"]["PickupStatus"]
          shippingAddress?: string | null
          status?: Database["public"]["Enums"]["OrderStatus"]
          total?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Order_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "Agent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      OrderItem: {
        Row: {
          createdAt: string
          id: string
          orderId: string
          price: number
          productId: string
          quantity: number
          status: Database["public"]["Enums"]["OrderItemStatus"]
          updatedAt: string
          vendorId: string
        }
        Insert: {
          createdAt?: string
          id: string
          orderId: string
          price: number
          productId: string
          quantity: number
          status?: Database["public"]["Enums"]["OrderItemStatus"]
          updatedAt?: string
          vendorId: string
        }
        Update: {
          createdAt?: string
          id?: string
          orderId?: string
          price?: number
          productId?: string
          quantity?: number
          status?: Database["public"]["Enums"]["OrderItemStatus"]
          updatedAt?: string
          vendorId?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrderItem_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_vendorId_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      Payout: {
        Row: {
          amount: number
          createdAt: string
          id: string
          reference: string | null
          status: Database["public"]["Enums"]["PayoutStatus"]
          updatedAt: string
          vendorId: string
        }
        Insert: {
          amount: number
          createdAt?: string
          id: string
          reference?: string | null
          status?: Database["public"]["Enums"]["PayoutStatus"]
          updatedAt?: string
          vendorId: string
        }
        Update: {
          amount?: number
          createdAt?: string
          id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["PayoutStatus"]
          updatedAt?: string
          vendorId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Payout_vendorId_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      Product: {
        Row: {
          categoryId: string
          comparePrice: number | null
          createdAt: string
          description: string | null
          id: string
          inventory: number
          isPublished: boolean
          name: string
          price: number
          slug: string
          updatedAt: string
          vendorId: string
        }
        Insert: {
          categoryId: string
          comparePrice?: number | null
          createdAt?: string
          description?: string | null
          id: string
          inventory?: number
          isPublished?: boolean
          name: string
          price: number
          slug: string
          updatedAt?: string
          vendorId: string
        }
        Update: {
          categoryId?: string
          comparePrice?: number | null
          createdAt?: string
          description?: string | null
          id?: string
          inventory?: number
          isPublished?: boolean
          name?: string
          price?: number
          slug?: string
          updatedAt?: string
          vendorId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Product_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Product_vendorId_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductImage: {
        Row: {
          alt: string | null
          createdAt: string
          id: string
          order: number
          productId: string
          updatedAt: string
          url: string
        }
        Insert: {
          alt?: string | null
          createdAt?: string
          id: string
          order?: number
          productId: string
          updatedAt?: string
          url: string
        }
        Update: {
          alt?: string | null
          createdAt?: string
          id?: string
          order?: number
          productId?: string
          updatedAt?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProductImage_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Return: {
        Row: {
          agentId: string
          createdAt: string
          customerId: string
          id: string
          orderId: string
          processDate: string | null
          productId: string
          reason: string
          refundAmount: number
          refundStatus: Database["public"]["Enums"]["RefundStatus"]
          requestDate: string
          status: Database["public"]["Enums"]["ReturnStatus"]
          updatedAt: string
          vendorId: string
        }
        Insert: {
          agentId: string
          createdAt?: string
          customerId: string
          id: string
          orderId: string
          processDate?: string | null
          productId: string
          reason: string
          refundAmount: number
          refundStatus?: Database["public"]["Enums"]["RefundStatus"]
          requestDate?: string
          status?: Database["public"]["Enums"]["ReturnStatus"]
          updatedAt?: string
          vendorId: string
        }
        Update: {
          agentId?: string
          createdAt?: string
          customerId?: string
          id?: string
          orderId?: string
          processDate?: string | null
          productId?: string
          reason?: string
          refundAmount?: number
          refundStatus?: Database["public"]["Enums"]["RefundStatus"]
          requestDate?: string
          status?: Database["public"]["Enums"]["ReturnStatus"]
          updatedAt?: string
          vendorId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Return_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "Agent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Return_vendorId_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "Vendor"
            referencedColumns: ["id"]
          },
        ]
      }
      Review: {
        Row: {
          comment: string | null
          createdAt: string
          customerId: string
          id: string
          productId: string
          rating: number
          updatedAt: string
        }
        Insert: {
          comment?: string | null
          createdAt?: string
          customerId: string
          id: string
          productId: string
          rating: number
          updatedAt?: string
        }
        Update: {
          comment?: string | null
          createdAt?: string
          customerId?: string
          id?: string
          productId?: string
          rating?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Review_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Relationships: []
      }
      Vendor: {
        Row: {
          accountNumber: string | null
          bankName: string | null
          banner: string | null
          commissionRate: number
          createdAt: string
          description: string | null
          id: string
          isApproved: boolean
          logo: string | null
          storeName: string
          updatedAt: string
          userId: string
        }
        Insert: {
          accountNumber?: string | null
          bankName?: string | null
          banner?: string | null
          commissionRate?: number
          createdAt?: string
          description?: string | null
          id: string
          isApproved?: boolean
          logo?: string | null
          storeName: string
          updatedAt?: string
          userId: string
        }
        Update: {
          accountNumber?: string | null
          bankName?: string | null
          banner?: string | null
          commissionRate?: number
          createdAt?: string
          description?: string | null
          id?: string
          isApproved?: boolean
          logo?: string | null
          storeName?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Vendor_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
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
      NotificationType:
        | "ORDER_STATUS_CHANGE"
        | "PICKUP_READY"
        | "ORDER_PICKED_UP"
        | "RETURN_REQUESTED"
        | "RETURN_APPROVED"
        | "RETURN_REJECTED"
        | "REFUND_PROCESSED"
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
      PaymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      PayoutStatus: "PENDING" | "COMPLETED" | "FAILED"
      PickupStatus: "PENDING" | "READY_FOR_PICKUP" | "PICKED_UP"
      RefundStatus: "PENDING" | "PROCESSED" | "REJECTED"
      ReturnStatus: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED"
      UserRole: "ADMIN" | "CUSTOMER" | "VENDOR" | "AGENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      NotificationType: [
        "ORDER_STATUS_CHANGE",
        "PICKUP_READY",
        "ORDER_PICKED_UP",
        "RETURN_REQUESTED",
        "RETURN_APPROVED",
        "RETURN_REJECTED",
        "REFUND_PROCESSED",
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
      ],
      PaymentStatus: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      PayoutStatus: ["PENDING", "COMPLETED", "FAILED"],
      PickupStatus: ["PENDING", "READY_FOR_PICKUP", "PICKED_UP"],
      RefundStatus: ["PENDING", "PROCESSED", "REJECTED"],
      ReturnStatus: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"],
      UserRole: ["ADMIN", "CUSTOMER", "VENDOR", "AGENT"],
    },
  },
} as const
