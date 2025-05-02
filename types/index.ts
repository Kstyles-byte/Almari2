import { Database } from './supabase'; // Import base Supabase types

// Re-export or define Enums if they aren't included in generated types or for easier access
export type UserRole = Database['public']['Enums']['UserRole'];
export type OrderStatus = Database['public']['Enums']['OrderStatus'];
export type PaymentStatus = Database['public']['Enums']['PaymentStatus'];
export type OrderItemStatus = Database['public']['Enums']['OrderItemStatus'];
export type PayoutStatus = Database['public']['Enums']['PayoutStatus'];
export type PickupStatus = Database['public']['Enums']['PickupStatus'];
export type ReturnStatus = Database['public']['Enums']['ReturnStatus'];
export type RefundStatus = Database['public']['Enums']['RefundStatus'];
export type NotificationType = Database['public']['Enums']['NotificationType'];

// --- Define Table Row Interfaces --- 
// Based on schema.sql, use generated types where possible and fill gaps

// Base User Profile (matches public.User table)
export type UserProfile = Database['public']['Tables']['User']['Row'];

// Customer Profile
export type Customer = Database['public']['Tables']['Customer']['Row'];

// Vendor Profile
export type Vendor = Database['public']['Tables']['Vendor']['Row'];

// Category
export type Category = Database['public']['Tables']['Category']['Row'] & {
    children?: Category[]; // For hierarchical structure if needed
};

// Product Image
export type ProductImage = Database['public']['Tables']['ProductImage']['Row'];

// Product 
export type Product = Database['public']['Tables']['Product']['Row'] & {
    // Add relationships inferred from schema or common usage patterns
    images?: ProductImage[]; 
    category?: Category; // Assuming relation is fetched
    vendor?: Vendor;     // Assuming relation is fetched
    // Supabase generated types might not include direct relations unless queried specifically
    // Add other potential relations like reviews if commonly fetched together
};

// Agent Profile
export type Agent = Database['public']['Tables']['Agent']['Row'];

// Order Item
export type OrderItem = Database['public']['Tables']['OrderItem']['Row'] & {
    product?: Product; // Assuming relation is fetched
    vendor?: Vendor;   // Assuming relation is fetched
};

// Order
export type Order = Database['public']['Tables']['Order']['Row'] & {
    items?: OrderItem[]; // Assuming relation is fetched
    customer?: Customer; // Assuming relation is fetched
    agent?: Agent;     // Assuming relation is fetched
};

// Review
export type Review = Database['public']['Tables']['Review']['Row'] & {
    customer?: Customer; // Assuming relation is fetched
    product?: Product; // Assuming relation is fetched
};

// Cart Item
export type CartItem = Database['public']['Tables']['CartItem']['Row'] & {
     product?: Product; // Assuming relation is fetched
};

// Cart
export type Cart = Database['public']['Tables']['Cart']['Row'] & {
    items?: CartItem[]; // Assuming relation is fetched
};

// Payout
export type Payout = Database['public']['Tables']['Payout']['Row'];

// Return Request
export type Return = Database['public']['Tables']['Return']['Row'] & {
    order?: Order;
    product?: Product;
    customer?: Customer;
    vendor?: Vendor;
    agent?: Agent;
};

// Notification
export type Notification = Database['public']['Tables']['Notification']['Row'] & {
     user?: UserProfile;
     order?: Order;
     return?: Return;
};

// --- Define specific types used elsewhere --- 

// Example: Maybe a simplified Product type for listings
export type ProductListing = Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'compare_at_price' | 'inventory'> & {
    category?: Pick<Category, 'id' | 'name' | 'slug'>;
    vendor?: Pick<Vendor, 'id' | 'store_name'>;
    mainImage?: Pick<ProductImage, 'url' | 'alt_text'>;
    averageRating?: number; // May be calculated separately
};

// Define HeroBanner type (Assuming it's in public schema, adjust if not)
// If HeroBanner table doesn't exist in your public schema, define it manually
export type HeroBanner = Database['public']['Tables']['HeroBanner'] extends { Row: infer R } ? R : { // Base definition if not inferred
    id: string; // or UUID if applicable
    title: string;
    subtitle?: string | null;
    buttonText?: string | null;
    buttonLink?: string | null;
    imageUrl: string;
    mobileImageUrl?: string | null;
    isActive: boolean;
    priority: number;
    startDate?: string | null; // ISO date string
    endDate?: string | null; // ISO date string
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}; 