# Dynamic Category Section Implementation

This document outlines the implementation of the dynamic category navigation section for the Zervia multi-vendor e-commerce platform.

## Overview

The category section on the homepage has been made dynamic, fetching real category data from the Supabase database. This allows for automatic updates to the UI whenever categories are modified in the database.

## Technical Implementation

### Database Schema

The existing `Category` table in Supabase is used, which has the following structure:

```sql
CREATE TABLE "Category" (
  "id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "icon" TEXT,
  "parentId" UUID REFERENCES "Category"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Server Actions

The `content.ts` file in the `actions` directory has been extended to include the following category-related functions:

- `getAllCategories(includeChildren?)`: Retrieves all categories with optional hierarchical structuring
- `getRootCategories()`: Gets only top-level categories with no parent
- `getChildCategories(parentId)`: Gets child categories for a specific parent
- `getCategoryBySlug(slug)`: Gets a specific category by its slug

### Category Component

The `CategorySection.tsx` component:

1. Fetches categories using the `getAllCategories()` server action
2. Maps the category data to UI components
3. Provides appropriate fallback images for categories based on their slug
4. Handles edge cases like missing data or empty results

## Features

- **Dynamic Category Display**: Categories are fetched from the database and displayed in the UI
- **Intelligent Image Handling**: Uses Emoji icons from the database when available, or falls back to appropriate images based on category name/slug
- **Error Handling**: Gracefully handles situations with no categories
- **Responsive Layout**: Maintains the responsive grid layout from the original static design

## How it Works

The category section follows these steps to render:

1. The server action queries the `Category` table in Supabase
2. Category data is returned in a normalized format
3. The component processes this data, adding appropriate images for each category
4. Categories are rendered in a responsive grid with proper styling
5. Each category links to the products page with the appropriate category filter

## Customization

### Fallback Images

The component includes a mapping of category types to fallback images:

```javascript
const fallbackCategoryImages = {
  "electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661...",
  "fashion": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04...",
  // etc.
};
```

To add new fallback images, simply extend this object with additional category keywords and image URLs.

### Category Icons

Categories can use either:

1. Emoji icons stored in the `icon` field (e.g., "📱", "👕")
2. URLs to image assets stored in the `icon` field
3. Automatic fallback images based on category name/slug

## Next Steps

1. Add category management in the admin dashboard
2. Implement subcategory display in the UI (expandable categories)
3. Add category image upload functionality with Cloudinary integration
4. Cache category data for improved performance 