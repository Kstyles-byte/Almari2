/**
 * This file contains TypeScript definitions for Supabase table structures.
 * As more parts of the application are migrated to Supabase,
 * add the corresponding table types here.
 */

// Type definitions for Supabase tables and schema
// This is a simplified version - you should generate a complete version 
// using the Supabase CLI's gen types command for production

export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string;
          email: string;
          role: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          updatedAt?: string;
        };
      };
      HeroBanner: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          buttonText: string | null;
          buttonLink: string | null;
          imageUrl: string;
          imagePublicId: string | null;
          mobileImageUrl: string | null;
          mobileImagePublicId: string | null;
          isActive: boolean;
          priority: number;
          startDate: string | null;
          endDate: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          buttonText?: string | null;
          buttonLink?: string | null;
          imageUrl: string;
          imagePublicId?: string | null;
          mobileImageUrl?: string | null;
          mobileImagePublicId?: string | null;
          isActive?: boolean;
          priority?: number;
          startDate?: string | null;
          endDate?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          buttonText?: string | null;
          buttonLink?: string | null;
          imageUrl?: string;
          imagePublicId?: string | null;
          mobileImageUrl?: string | null;
          mobileImagePublicId?: string | null;
          isActive?: boolean;
          priority?: number;
          startDate?: string | null;
          endDate?: string | null;
          updatedAt?: string;
        };
      };
      // Add other tables as needed
    };
    Views: {
      // Define views if any
    };
    Functions: {
      // Define functions if any
    };
    Enums: {
      // Define enums if any
      UserRole: 'USER' | 'ADMIN' | 'VENDOR' | 'AGENT';
    };
  };
};

// Export specific types that can be used throughout the application
export type UserRow = Database['public']['Tables']['User']['Row'];
export type HeroBannerRow = Database['public']['Tables']['HeroBanner']['Row'];
export type UserRole = Database['public']['Enums']['UserRole'];

// For convenience, also export the Category type from the content.ts file
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  children?: Category[]; // For hierarchical data
  createdAt: string;
  updatedAt: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  isActive: boolean;
  priority: number;
  startDate: string | null; // ISO 8601 date string
  endDate: string | null;   // ISO 8601 date string
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number; // Prisma Decimal maps to number
  comparePrice: number | null; // Prisma Decimal? maps to number | null
  categoryId: string;
  inventory: number;
  isPublished: boolean;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations like images, category, vendor can be added here as optional
  // if they are fetched using .select() in Supabase queries.
  // e.g., images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  order: number;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  isApproved: boolean;
  commissionRate: number; // Prisma Decimal maps to number
  bankName: string | null;
  accountNumber: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations can be added if needed
  // user?: User; // Need User type defined
  // products?: Product[];
}

// Corresponds to the custom public.User table
export interface UserProfile {
  id: string; // Should match Supabase Auth user ID
  name: string;
  email: string; // Unique
  // password field is handled by Supabase Auth, not stored here
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR' | 'AGENT';
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface Review {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  vendorId: string;
  quantity: number;
  price: number; // Prisma Decimal maps to number
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'; // Map OrderItemStatus enum
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface Customer {
  id: string;
  userId: string; // Foreign key to UserProfile or Supabase Auth User
  phone: string | null;
  address: string | null;
  hostel: string | null;
  room: string | null;
  college: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations can be added if needed
  // user?: UserProfile; // If fetching joined data
  // orders?: Order[]; // Need Order type defined
  // reviews?: Review[];
  // cart?: Cart; // Need Cart type defined
}

// Define Cart type
export interface Cart {
  id: string;
  customerId: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations
  // items?: CartItem[];
}

// Define Order type
export interface Order {
  id: string;
  customerId: string;
  agentId: string | null; // Agent might not be assigned initially
  total: number; // Prisma Decimal maps to number
  shippingAddress: string | null;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED' | 'PARTIALLY_FULFILLED'; // Map OrderStatus enum
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED'; // Map PaymentStatus enum
  paymentReference: string | null;
  pickupCode: string | null; // Assuming this is added
  pickupStatus: 'PENDING' | 'READY_FOR_PICKUP' | 'PICKED_UP';
  pickupDate: string | null; // Add pickupDate field
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations
  // items?: OrderItem[];
  // customer?: Customer;
  // agent?: Agent;
}

// Define Agent type
export interface Agent {
  id: string;
  userId: string;
  name: string; // Added based on usage in createOrder
  email: string; // Added based on API route usage
  phone: string; // Added based on API route usage
  location: string; // Geo-location data? JSONB?
  operatingHours: string | null; // Added based on API route usage (optional)
  capacity: number;
  isActive: boolean;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations
  // user?: UserProfile;
  // orders?: Order[];
}

export interface Notification {
  id: string;
  userId: string;
  orderId: string | null;
  returnId: string | null;
  type: string; // Ideally map NotificationType enum if available/needed
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO 8601 date string
  // Supabase handles data/metadata differently, often as a JSONB column.
  // The original `data` field from Prisma might need adjustment based on Supabase schema.
  // data?: Record<string, any>; 
}

// Define Payout type
export interface Payout {
  id: string;
  vendorId: string;
  amount: number; // Prisma Decimal maps to number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // Map PayoutStatus enum
  processedAt: string | null; // ISO 8601 date string
  transactionId: string | null;
  notes: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations
  // vendor?: Vendor;
}

// Define Return type based on schema.sql
export interface Return {
  id: string;
  orderId: string;
  productId: string;
  customerId: string;
  vendorId: string;
  agentId: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'; // Map ReturnStatus enum
  refundAmount: number; // Prisma Decimal maps to number
  refundStatus: 'PENDING' | 'PROCESSED' | 'REJECTED'; // Map RefundStatus enum
  requestDate: string; // ISO 8601 date string
  processDate: string | null; // ISO 8601 date string
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Relations can be added if needed
  // order?: Order;
  // product?: Product;
  // customer?: Customer;
  // vendor?: Vendor;
  // agent?: Agent;
} 