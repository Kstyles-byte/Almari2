# Dynamic Hero Section Implementation

This document outlines the implementation of the dynamic hero section for the Zervia multi-vendor e-commerce platform.

## Overview

The hero section of the homepage has been made dynamic, allowing content to be managed through the database. This implementation uses Supabase to store and retrieve hero banner data, which can be later managed through an admin dashboard.

## Technical Implementation

### Database Schema

The `HeroBanner` table in Supabase has the following structure:

```sql
CREATE TABLE IF NOT EXISTS "HeroBanner" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "buttonText" TEXT,
  "buttonLink" TEXT,
  "imageUrl" TEXT NOT NULL,
  "mobileImageUrl" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "priority" INTEGER DEFAULT 0,
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Server Actions

The `content.ts` file in the `actions` directory contains the following functions:

- `getActiveHeroBanners()`: Retrieves active hero banners ordered by priority
- `getHeroBannerById(id)`: Gets a specific banner by ID
- `createHeroBanner(data)`: Creates a new hero banner
- `updateHeroBanner(id, data)`: Updates an existing banner
- `deleteHeroBanner(id)`: Deletes a banner
- `toggleHeroBannerActive(id)`: Toggles the active status of a banner

### Hero Component

The `Hero.tsx` component fetches banner data using the `getActiveHeroBanners()` server action and displays the highest priority active banner. If no banner is found, it falls back to default content.

## Features

- **Schedule Content**: Set start and end dates for banners to schedule campaigns
- **Prioritization**: Assign priority values to determine which banner shows first
- **Mobile Optimization**: Separate image URLs for desktop and mobile views
- **Active/Inactive Toggle**: Easily enable or disable banners without deleting them

## Admin Management (Future Implementation)

The admin dashboard will include functionality to:

1. Create new hero banners through a user-friendly form
2. Upload images directly to Cloudinary
3. Schedule banner display periods
4. Manage existing banners (edit, delete, deactivate)
5. Reorder banners by priority

## Setup Instructions

1. Add Supabase credentials to your environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-key"
   ```

2. Create the `HeroBanner` table in Supabase SQL Editor using the schema above

3. Add initial banner data using SQL:
   ```sql
   INSERT INTO "HeroBanner" (
     "title", "subtitle", "buttonText", "buttonLink", "imageUrl", "isActive", "priority"
   ) VALUES 
   (
     'Summer Collection',
     'Discover our new arrivals for the summer season with amazing discounts',
     'Shop Now',
     '/products?category=fashion',
     'https://example.com/banner-image.jpg',
     true,
     10
   );
   ```

## Next Steps

1. Implement admin CRUD interface for hero banners
2. Add image upload functionality with Cloudinary integration
3. Integrate carousel functionality for multiple active banners
4. Add analytics to track banner performance 