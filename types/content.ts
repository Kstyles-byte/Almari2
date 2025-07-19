// This file defines TypeScript types for content-related data structures.
// Based on the Supabase schema for HeroBanner

export interface HeroBanner {
  id: string; // UUID
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
  startDate: string | null; // ISO date string
  endDate: string | null;   // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface SpecialOffer {
  id: string; // UUID
  title: string;
  subtitle: string | null;
  discountCode: string | null; // e.g., "NEWSTUDENT15"
  discountDescription: string | null; // e.g., "Get 15% off your first purchase"
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
  priority: number; // Higher numbers take precedence when selecting the active offer
  startDate: string | null; // ISO date string
  endDate: string | null;   // ISO date string

  // New coupon-related fields
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  // Postgres columns are lowercase; keep aliases for type safety
  startdate?: string | null;
  enddate?: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Add other content types here as needed 