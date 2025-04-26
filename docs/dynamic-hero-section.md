# Dynamic Hero Section Implementation

This document outlines the implementation of the dynamic hero section for the Zervia multi-vendor e-commerce platform.

## Overview

The hero section of the homepage has been made dynamic, allowing content to be managed through the admin dashboard. This implementation uses Next.js server actions and Prisma with PostgreSQL to store and retrieve hero banner data.

## Technical Implementation

### Database Schema

The `HeroBanner` model in Prisma has the following structure:

```prisma
model HeroBanner {
  id            String    @id @default(uuid())
  title         String
  subtitle      String?
  buttonText    String?
  buttonLink    String?
  imageUrl      String    // Cloudinary URL
  mobileImageUrl String?  // Responsive image for mobile
  isActive      Boolean   @default(true)
  priority      Int       @default(0)  // For ordering multiple banners
  startDate     DateTime?  // Optional scheduling
  endDate       DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Server Actions

The `content.ts` file in the `actions` directory contains the following functions for hero banner management:

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

## Admin Management

The admin dashboard includes functionality to:

1. View all hero banners at `/admin/content/hero-banners`
2. Create new hero banners through a user-friendly form at `/admin/content/hero-banners/new`
3. Edit existing banners
4. Delete banners
5. Toggle banner active status

### HeroBannerForm Component

The `HeroBannerForm.tsx` component handles:

- Image uploads to Cloudinary
- Form validation
- Date selection with Calendar and Popover components
- Active/inactive toggle with Switch component
- Priority settings
- Saving banner data through server actions

## Admin Access

The admin interface can be accessed at:

```
https://yourdomain.com/admin
```

For hero banner management specifically:

```
https://yourdomain.com/admin/content/hero-banners
```

## Implementation Notes

1. The hero banner implementation uses Radix UI components for the admin interface
2. Images are uploaded to Cloudinary for optimization and CDN delivery
3. The system supports scheduling banners for specific date ranges
4. Banners are prioritized based on a numeric priority value (lower numbers display first)
5. The homepage automatically displays the highest priority active banner

## Next Steps

1. Add carousel functionality for multiple active banners
2. Implement A/B testing for different banner designs
3. Add analytics tracking for banner engagement
4. Support additional banner formats and layouts