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

// Add other content types here as needed 