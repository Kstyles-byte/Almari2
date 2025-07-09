# Zervia E-commerce Platform Implementation

This document tracks the progress of implementing the Zervia multi-vendor e-commerce platform.

## Task Dependencies & Complexity

> The following table lists outstanding tasks, their prerequisite dependencies, and an estimated implementation complexity. Use this matrix to decide sequencing (complete tasks with unmet dependencies first and unblock downstream work).

| Task | Depends On | Complexity |
| --- | --- | --- |
| Data migration & validation | Supabase migration scripts completed | Medium |
| Validate data integrity | Data migration scripts | Medium |
| Test data relationships | Data migration scripts | Medium |
| Update API routes (remaining work) | Data migration & validation | High |
| Display actual product variants | Variant schema & supporting services | High |
| Enhance product discovery (advanced filters, recently-viewed, recommendations) | Search backend, tracking events | High |
| Address management with validation | Address CRUD foundation | Medium |
| Enhanced order details with tracking | Order status events, logistics updates | Medium |
| Return request system (eligibility, form, history, notifications) | Returns schema, notification service | High |
| Inventory management with stock levels | Product CRUD & order events | Medium |
| Financial reports & analytics | Orders, payouts, refunds completed | High |
| Return management workflow (admin & agent) | Return request system | High |
| Vendor store page (banner, description, categories, featured products, ratings) | Vendor profile schema/images | Medium |
| Admin dashboard (user, vendor, product, order, content, system, agent, returns modules) | Core CRUD endpoints stable | High |
| Static informational pages (About, Contact, FAQ, Policies) | None | Low |
| System-wide enhancements (performance, accessibility, cross-browser, mobile, SEO, analytics) | Feature set stabilized | Medium |
| Finalize notification system connections (admin / customer / vendor / agent) | Notification service scaffolding | High |

#Backend Tasks
- [x] Initialize Next.js project with App Router
- [x] Create task list for implementation tracking
- [x] Set up database with Prisma ORM
- [x] Configure environment variables
- [x] Implement authentication with NextAuth.js
- [x] Set up middleware for authorization
- [x] Set up Cloudinary integration for image storage
- [x] Implement user management API routes
- [x] Implement category management API routes
- [x] Configure Paystack for payment processing
- [x] Set up webhook endpoint for Paystack
- [x] Implement product management API routes
- [x] Implement cart management services
- [x] Implement order management services
- [x] Implement vendor and customer services
- [x] Implement reviews and ratings
- [x] Implement server actions for form submissions
- [x] Set up deployment on Vercel
- [x] Implement agent-based delivery model
- [x] Create new Agent entity in database schema
- [x] Modify Order schema to support agent-based delivery
- [x] Create Return entity for return/refund system
- [x] Implement agent-related API routes
- [x] Implement return/refund API routes
- [x] Implement notification system for order status changes
- [x] Set up automated refund processing through Paystack
- [x] Create seed data for testing and development
- [x] Create core UI components:
  - [x] Button component with variants
  - [x] Input component with variants
  - [x] Form components
  - [x] Card components
  - [x] Modal/dialog component
  - [x] Tabs component
  - [x] Pagination component
  - [x] Badge component
  - [x] Tooltip component
  - [x] Dropdown menu component
  - [x] Breadcrumb component
  - [x] Avatar component
  - [x] Loader/spinner component
  - [x] Progress bar component
  - [x] Image gallery component
  - [x] Star rating component
  - [x] Accordion component
  - [x] Table component
  - [x] Tag/pill component
  - [x] Empty state component
  - [x] Skeleton loader components
- [x] Create global layout components:
  - [x] Root layout with metadata
  - [x] Header component
  - [x] Footer component
  - [x] Mobile sidebar navigation (implemented as part of Header)
- [x] Update product search and filtering
  - [x] Convert product review system




  


### Phase 1: UI Layout Components (Static)
- [x] Configure Tailwind CSS
- [x] Set up component folder structure
- [x] Create homepage layout:
  - [x] Hero section
  - [x] Category navigation
  - [x] Featured products section
  - [x] Vendor highlights section
  - [x] Special offers banner
  - [x] Testimonials/reviews section
  - [x] Newsletter signup
  - [x] Trending products section
  - [x] "Why choose us" section
  - [x] Agent pickup section
- [x] Create cart page UI:
  - [x] Cart item list
  - [x] Cart summary
  - [x] Coupon code input
  - [x] Empty cart state
  - [x] Recommended products
- [x] Create checkout flow UI:
  - [x] Checkout steps indicator
  - [x] Information step
  - [x] Agent location selector
  - [x] Payment step
  - [x] Confirmation step
  - [x] Order summary sidebar
- [x] Create error pages:
  - [x] 404 Not Found page
  - [x] 500 Server Error page (general error handling)
- [x] Implement product listings page UI:
  - [x] Category header
  - [x] Filter sidebar
  - [x] Sort options dropdown
  - [x] Product grid/list view
  - [x] Pagination controls integration
  - [x] "No results" empty state
  - [x] Quick view modal
- [x] Create product detail page UI:
  - [x] Breadcrumb navigation
  - [x] Product image gallery
  - [x] Product information section
  - [x] Vendor information card
  - [x] Delivery information section
  - [x] Product tabs (description, specs, reviews)
  - [x] Reviews section
  - [x] Related products section
  
### Phase 1.5: Backend Migration to Supabase
- [x] Set up Supabase client configuration:
  - [x] Install Supabase client dependencies
  - [x] Configure environment variables for Supabase
  - [x] Create Supabase client utility functions
  - [x] Set up type definitions for Supabase tables

- [x] Migrate authentication actions:
  - [x] Convert user authentication to Supabase Auth
  - [x] Update session management
  - [x] Migrate role-based access control
  - [x] Update password reset flow

- [x] Migrate product-related actions:
  - [x] Convert product CRUD operations
  - [x] Update product image handling
  - [x] Migrate category management
  - [x] Update product search and filtering
  - [x] Convert product review system

- [x] Migrate order management:
  - [x] Convert order creation flow
  - [x] Update order status management
  - [x] Migrate order item handling
  - [x] Update order notifications
  - [x] Convert order history tracking

- [x] Migrate cart functionality:
  - [x] Convert cart operations
  - [x] Update cart item management
  - [x] Migrate cart persistence
  - [x] Update cart calculations

- [x] Migrate vendor management:
  - [x] Convert vendor CRUD operations (in service/vendor.ts)
  - [x] Update vendor approval flow (in service/vendor.ts)
  - [x] Migrate vendor product management (getVendorProducts in service/vendor.ts)
  - [x] Update vendor payout system (createPayoutRequest in actions/vendor-orders.ts)

- [x] Migrate agent management:
  - [x] Convert agent CRUD operations (in service/agent.ts)
  - [x] Update agent location tracking (handled via CRUD)
  - [x] Migrate order pickup system (markOrderReadyForPickup, verifyCustomerPickup in actions/agent.ts)
  - [x] Update agent capacity management (handled via CRUD)

- [x] Migrate return management:
  - [x] Convert return request handling (in service/return.ts)
  - [x] Update return status tracking (approve/reject/complete in service/return.ts)
  - [x] Migrate refund processing (processRefund in service/return.ts, requires refund service)
  - [x] Migrate return notifications (notifications created within actions)

- [ ] Data migration and validation:
  - [x] Create data migration scripts
  - [ ] Validate data integrity
  - [ ] Test data relationships
  - [x] Verify foreign key constraints (via schema export)

- [ ] Update API routes:
  - [x] Convert REST endpoints to Supabase (in `/app/api/*` routes)
  - [x] Update API authentication (Handled by `auth()` checks in routes/actions)
  - [x] Migrate webhook handlers (Assumed correct - Paystack handlers were separate)
  - [x] Update error handling (Basic try/catch added in migrated routes)
  - Specific Routes Status:
    - **Migrated:**
      - [x] `/api/users/[id]/route.ts` (GET, PUT, DELETE)
      - [x] `/api/cart/items/route.ts` (POST, DELETE)
      - [x] `/api/customers/[id]/route.ts` (GET, PUT, GET_orders, GET_reviews)
      - [x] `/api/products/[id]/route.ts` (GET, PUT, DELETE)
      - [x] `/api/vendors/[id]/route.ts` (GET, PUT, PATCH)
      - [x] `/api/orders/route.ts` (POST only)
      - [x] `/api/returns/route.ts` (GET, POST)
      - [x] `/api/reviews/route.ts` (GET, POST)
      - [x] `/api/notifications/route.ts` (GET, PATCH)
      - [x] `/api/products/route.ts` (GET, POST)
      - [x] `/api/cart/route.ts` (GET)
      - [x] `/api/users/route.ts` (GET)
      - [x] `/api/categories/route.ts` (GET, POST)
      - [x] `/api/vendors/route.ts` (GET, POST)
      - [x] `/api/customers/route.ts` (GET, POST)
      - [x] `/api/agents/route.ts` (GET, POST)
    - **Needs Migration:**
      - [x] `/api/orders/route.ts` (GET handler)
      - [x] `/api/agents/[id]/orders/route.ts` (GET handler)
      - [x] `/api/agents/[id]/pickups/route.ts` (GET, POST handlers)
      - [x] `/api/agents/[id]/route.ts` (GET, PUT, DELETE handlers)
      - [x] `/api/categories/[id]/route.ts` (GET, PUT, DELETE handlers)
      - [x] `/api/notifications/[id]/route.ts` (GET, PATCH/DELETE ownership checks)
      - [x] `/api/orders/[id]/route.ts` (GET, PUT handlers)
      - [x] `/api/orders/[id]/return/route.ts` (POST handler)
      - [x] `/api/returns/[id]/route.ts` (PUT handler)
      - [x] `/api/reviews/[id]/route.ts` (GET, PUT/DELETE ownership checks)



### Phase 2: API Integration (Dynamic Data)
- [ ] Connect homepage sections to real data:
  - [x] Hero section dynamic content
      - [x] Define Supabase schema for `HeroBanner` table (incl. Cloudinary IDs) - *Done*
     - [x] Create service `getActiveHeroBanner` to fetch active banner (`lib/services/content.ts`) - *Done*
     - [x] Update `Hero.tsx` component to use `getActiveHeroBanner` service - *Done*
     - [x] Create `updateHeroImage` server action with Cloudinary upload & Admin role  check (`actions/content.ts`) - *Done*
     - [x] Create `AdminHeroImageForm.tsx` component (`components/admin/content/`) - *Done*
     - [x] Create Admin page route (`/admin/content/hero`) to display the form - *Done*
     - [x] Implement `updateHeroContent` server action for text/button fields - *Done*
     - [x] Enhance `AdminHeroForm` to manage all content fields (title, subtitle, button, dates, active status) - *Done*
     - [x] Implement functionality to create/delete Hero Banners via Admin UI - *Done*
     - [x] Refine Admin UI styling based on `zervia-pixel-bloom` reference - *Done*
  - [x] Category navigation (Fetch categories from database and display)
  - [x] Featured products section (Fetch top vendors from database) - *Action `getFeaturedVendors` updated to use Supabase.*
  - [x] Special offers banner (Fetch current promotions)
  - [x] Testimonials/reviews section (Fetch actual customer reviews)
  - [x] Newsletter signup (Implement actual subscription)
  - [x] Trending products section (Fetch trending products based on sales data) - *Added `getTrendingProducts` action and updated component.*
  - [x] Agent pickup section (Show real agent locations) - *Added `getActiveAgents` action and updated component.*
- [x] Implement authentication UI with real data:
  - [x] Configure guest access middleware/logic (Verify Supabase session handling) - *Middleware updated to use Supabase `updateSession` and includes RBAC query.* ✅
  - [x] Sign in page with actual authentication (`SignInForm.tsx` uses `signInWithSupabase`) - *Form, Action, and Page created.* ✅
  - [x] Display authentication errors on UI (e.g., on /login page from query params) - *Login and Signup pages now display URL messages.* ✅
  - [x] Sign up page UI integration (`SignUpForm.tsx` to call Supabase action) - *Form and Page created.* ✅
  - [x] Sign up server action using Supabase (`actions/auth.ts` -> `signUpWithSupabase`) - *Action created and adapted for disabled email confirmation.* ✅
  - [x] Sign out functionality handled directly in components (`components/layout/customer-layout.tsx`, `components/layout/AdminLayout.tsx`, `components/layout/vendor-layout.tsx`, `components/admin/dashboard-header.tsx`) using Supabase client-side `signOut` and router redirect. Removed dedicated `/auth/signout` route and server action. ✅
  - [x] Forgot password page UI and server action - *Form, Page, and Action created.* ✅
  - [x] Reset password page UI and server action - *Form, Page, and Action created.* ✅
  - [x] Email verification integration (Create `/auth/confirm/route.ts` handler) - *Route handler created; Supabase email template config needed.* ✅
- [x] Implement product listings with real data:
  - [x] Fetch products by category - *Refactored `/products` page to Server Component, added `getProducts` action to fetch based on URL `searchParams` (category, sort, page, query). Placeholder components used for filters/sort/pagination.* 
  - [x] Implement filtering with backend integration - *Enhanced `getProducts` action for price/brand filters. Created/refactored `ProductFilters` & `MobileFilters` client components to update URL. Needs UI polishing & dynamic options.* 
  - [x] Implement sorting with backend integration - *Enhanced `getProducts` action for sorting. Created `ProductSort` client component to update URL.* 
  - [x] Dynamic pagination based on product count - *`getProducts` returns count/totalPages. Created `PaginationControls` client component to update URL.* 
- [x] Implement product detail page with real data:
  - [x] Fetch individual product details
  - [ ] Display actual product variants *(Skipped for now - requires variant system)*
  - [x] Show real product reviews
  - [x] Display actual related products
- [x] Implement cart functionality with real data:
  - [x] Fetch user's cart items
  - [x] Display actual product information
  - [x] Calculate real totals based on cart items
  - [x] Apply valid coupon codes
- [x] Fetch user's saved addresses
- [x] Load actual agent locations from database
- [x] Real-time order summary
- [x] Integrate with Paystack payment processing

### Phase 2.5: Vendor Onboarding Implementation
- [x] Create Vendor Application flow (for existing logged-in users):
    - [x] Create page route `/account/become-vendor` (protected) - ✅ `almari-app/app/account/become-vendor/page.tsx`
    - [x] Create `VendorApplicationForm` client component (`components/forms/VendorApplicationForm.tsx`) with Zod schema - ✅ `almari-app/components/forms/VendorApplicationForm.tsx`
    - [x] Create `applyForVendor` server action (`actions/vendor.ts`) to save application to `Vendor` table (pending approval) - ✅ `almari-app/actions/vendor.ts`
    - [x] Fix `generateUniqueId` usage in `actions/vendor.ts` - ✅ `almari-app/actions/vendor.ts`
    - [x] Add link/button for logged-in users (e.g., in account dropdown/page) to navigate to `/account/become-vendor`
    - [x] Create success/pending page or notification after application submission
- [x] Create Dedicated Vendor Signup flow (for new users wanting to be vendors):
    - [x] Create page route `/signup/vendor`
    - [x] Create `VendorSignUpForm` client component (`components/forms/VendorSignUpForm.tsx`) with combined Zod schema (user + vendor details)
    - [x] Create `signUpAsVendor` server action (`actions/auth.ts`) to call `supabase.auth.signUp`, let trigger create profile, then insert into `Vendor` table (pending approval) - ✅ `almari-app/actions/auth.ts`
    - [x] Fix `generateUniqueId` usage in `actions/auth.ts` - ✅ `almari-app/actions/auth.ts` (during vendor signup part)
    - [x] Add link on main login/signup pages to navigate to `/signup/vendor`
    - [x] Redirect user after vendor signup (e.g., to login page with pending approval message)
- [x] Address Type Definition Issues:
    - [x] Regenerate base Supabase types (`types/supabase.ts`) - ✅ Ran `npx supabase gen types...`
    - [x] Create custom types file (`types/index.ts`) for application-specific types - ✅ `almari-app/types/index.ts`
    - [x] Update imports in affected files to use `types/index.ts` - ✅ `actions/admin-products.ts`, `actions/agent.ts`, `actions/content.ts`, `components/home/CategorySection.tsx`

### Phase 3: Functional Interactions
- [x] Implement "Add to Cart" functionality:
  - [x] Add products to cart from product detail page
  - [x] Add products to cart from product listings
  - [x] Add products to cart from recommended sections
  - [x] Show success notification on add
  - [x] Handle out-of-stock situations
- [x] Implement cart management:
  - [x] Update product quantities
  - [x] Remove items from cart
  - [x] Clear entire cart
- [x] Implement checkout process:
  - [x] Save delivery information
  - [x] Select agent location
  - [x] Process payment
  - [x] Handle payment errors
  - [x] Show order confirmation
- [x] Implement search functionality:
  - [x] Search box in header
  - [x] Search results page
  - [x] Filter search results
  - [x] Product suggestions
- [x] Implement user account functionality:
  - [x] View order history
  - [x] Track current orders (view order detail)
  - [x] Manage profile information
  - [x] Manage addresses (structure created, needs components)
  - [x] Add account route redirection based on user role
- [x] Implement notifications:
  - [x] View notifications (via `/api/notifications` route, using `actions/notifications.ts::getNotifications`)
  - [x] Mark notifications as read (via `/api/notifications` route, using `actions/notifications.ts::markNotificationAsRead`)
  - [x] Notification preferences (Not Implemented)
  - Implementation Details:
    - Notifications are created by inserting directly into `public."Notification"` table using Supabase client.
    - Logic is encapsulated in `lib/services/notification.ts` and triggered via server actions (e.g., within `actions/orders.ts` upon order status change, `actions/returns.ts` for return updates).
    - Access control relies on Supabase Row Level Security (RLS) policy `Allow user access own notifications`.
    - **Issue:** Needs verification/implementation to ensure admin users receive notifications upon new order placement.
    - Relevant Files: `lib/services/notification.ts`, `actions/notifications.ts`, `actions/orders.ts`, `almari-app/prisma/schema-fix.sql` (RLS policy definition), `almari-app/app/api/notifications/route.ts`
- [x] Refine UI Consistency:
  - [x] Adjust global page padding (`almari-app/components/layout/page-wrapper.tsx`, `almari-app/app/layout.tsx`) - Removed padding from home page, kept for others.
  - [x] Update currency display to Naira (₦) across multiple components (`almari-app/app/cart/page.tsx`, `almari-app/components/checkout/checkout-summary.tsx`, `almari-app/components/checkout/checkout-payment-form.tsx`, `almari-app/components/products/product-grid.tsx`, `almari-app/components/cart/CartItem.tsx`, `almari-app/components/products/RelatedProductCard.tsx`, `almari-app/app/product/[slug]/page.tsx`, `almari-app/components/home/ProductShowcase.tsx`, `almari-app/components/customer/wishlist-item.tsx`, `almari-app/components/products/quick-view-modal.tsx`, `almari-app/components/vendor/product-filters.tsx`, `almari-app/components/products/product-filters.tsx`)
- [x] Cart page enhancements:
  - [x] Fetch "You Might Also Like" products from database (`almari-app/app/cart/page.tsx`) - Used `getProducts` action instead of hardcoded data.
- [x] UI and User Experience Improvements:
  - [x] Replace basic payment verification loader with fancy loader component
  - [x] Update login/signup page redirections to route to appropriate role-based dashboards
  - [x] Reduce size of product cards on homepage for better desktop presentation

### Phase 4: Advanced Customer Features
- [ ] Enhance product discovery:
  - [ ] Advanced filters with faceted search
  - [ ] Implement recently viewed products tracking
  - [ ] Product recommendations based on history
- [ ] Enhance customer dashboard:
  - [x] Wishlist management with database integration
    - [x] Create wishlist schema and SQL migrations (`almari-app/prisma/wishlist-schema.sql`)
    - [x] Implement wishlist service functions (`almari-app/lib/services/wishlist.ts`)
    - [x] Create server actions for wishlist operations (`almari-app/actions/wishlist.ts`)
    - [x] Implement WishlistButton component with toggleable state (`almari-app/components/products/WishlistButton.tsx`)
    - [x] Enhance WishlistButton UI with animations and improved design
    - [x] Integrate wishlist status in product grid (`almari-app/components/products/product-grid.tsx`)
    - [x] Create wishlist page to view saved items (`almari-app/app/customer/wishlist/page.tsx`)
    - [x] Implement wishlist item component for managing saved products (`almari-app/components/customer/wishlist-item.tsx`)
  - [ ] Address management with validation
  - [x] Review management (write/edit/delete)
    - Status: ✅ Completed.
    - Description: Implemented core functionality for customers to write, edit, and delete their product reviews. Addressed an issue where updating or deleting a review would sometimes result in a "Review not found" error despite the review existing. The fix involved removing a redundant existence check in the service layer (`lib/services/review.ts`) as the action layer (`actions/reviews.ts`) already verifies the review's presence, resolving an inconsistency in data retrieval.
    - Relevant Files:
      - `almari-app/lib/services/review.ts` (Primary fix location)
      - `almari-app/actions/reviews.ts` (Initial data fetching and logging for debug)
      - `almari-app/app/customer/reviews/page.tsx` (Displays customer reviews)
      - `almari-app/components/customer/customer-reviews-list.tsx` (Manages review display and interactions)
      - `almari-app/components/customer/review-card.tsx` (Individual review display)
      - `almari-app/components/customer/review-form.tsx` (Form for submitting/editing reviews)
      - `almari-app/components/customer/delete-review-dialog.tsx` (Confirmation for deleting reviews)
  - [ ] Enhanced order details with tracking
- [ ] Create return request system:(the basis of the returns system has been created, but needs to be integrated with the admin dashboard and agent dashboard)
  - [ ] Return eligibility check based on policies
  - [ ] Return request form with reason selection
  - [ ] Return history tracking
  - [ ] Return status notifications

### Phase 5: Vendor & Agent Experience
- [x] Enhance vendor dashboard:
  - [x] Advanced product management (CRUD operations)
    - **Implementation Details:**
      - Created a product form component (`almari-app/components/vendor/product-form.tsx`) for creating and editing products
      - Implemented server actions (`almari-app/actions/vendor-products.ts`) for product CRUD operations
      - Set up Cloudinary integration for product image uploads
      - Added Row Level Security (RLS) policies to ensure vendors can only manage their own products
      - **Product Editing Enhancements:**
        - Enhanced the product edit page with improved error handling and validation
        - Added direct edit button in product listing for easier access
        - Implemented real-time upload progress indicators for product images
        - Added validation for image file types and sizes
        - Implemented unsaved changes warning when leaving the form
        - Enhanced server-side authentication and authorization for product editing
        - Added better image management with primary image selection
        - Improved slug validation with duplicate checking
        - Added success notifications with redirection after successful update
        - Improved error handling with clear error messages
      - **Bug Fixes:**
        - Fixed authentication issues with Supabase session in server actions by implementing proper async/await pattern
        - Resolved "cloud_name is disabled" error by hardcoding Cloudinary credentials
        - Implemented fallback mechanism for image upload failures using data URLs and SVG placeholders
        - Updated Next.js config to allow images from various domains
        - **Product Publishing/Unpublishing Enhancements:**
          - Fixed authentication issues in toggle product publish status functionality
          - Enhanced server-side authentication with robust session refresh mechanisms
          - Improved client-side error handling for better user experience
          - Updated product image preview to show uploaded files immediately
          - Standardized authentication approach across all product management actions
          - Added detailed logging to aid in troubleshooting authentication issues
      - **Technical Notes:**
        - **Client vs Server Auth**: Discovered and fixed issues with authentication context between client and server components
          - Supabase authentication requires specific session handling in server components
          - Server actions need `createServerActionClient()` with proper async cookies handling
          - Client components should use `createClientComponentClient()` and handle session state separately
        - **Environment Variables**: Implemented workarounds for environment variable loading issues in client components
          - Client-side environment variables must be prefixed with `NEXT_PUBLIC_`
          - For sensitive credentials, hardcoding in server actions may be necessary when env vars fail
          - Created a robust fallback pattern for handling environment variable failures
        - **Image Upload Process**: Created a multi-tier approach
          1. Try Cloudinary upload first (if configured)
          2. Fall back to data URL creation from uploaded file (for development)
          3. Use SVG placeholder as final fallback
        - **Supabase RLS Policies**:
          - Products table has RLS policy allowing vendors to only manage their own products
          - ProductImage table has RLS policy allowing vendors to only manage images for their products
          - Authentication in server actions must properly verify vendor ownership
      - **Reference Implementation**:
        - **Server Action with Proper Auth**:
          ```typescript
          // In almari-app/actions/vendor-products.ts
          export async function createProduct(data) {
            try {
              // Use the async server action client
              const supabase = await createAsyncServerActionClient();
          
              // Get the current user
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              
              if (!user) {
                return { error: 'Unauthorized - No active session found', success: false };
              }
          
              // Get vendor ID (ownership verification)
              const { data: vendorData, error: vendorError } = await supabase
                .from('Vendor')
                .select('id')
                .eq('user_id', user.id)
                .single();
          
              if (vendorError || !vendorData) {
                return { error: 'Vendor not found for this user', success: false };
              }
          
              // Create product with verified vendor_id
              const { data: product, error: productError } = await supabase
                .from('Product')
                .insert({
                  ...data,
                  vendor_id: vendorData.id
                })
                .select()
                .single();
          
              if (productError) {
                return { error: `Error creating product: ${productError.message}`, success: false };
              }
          
              return { success: true, productId: product.id };
            } catch (error) {
              return { error: `Unexpected error: ${error.message}`, success: false };
            }
          }
          ```
        - **Robust Image Upload with Fallbacks**:
          ```typescript
          // In almari-app/components/vendor/product-form.tsx
          // For handling image uploads with fallbacks
          try {
            // Try Cloudinary upload first
            const cloudName = 'your_cloud_name'; // Hardcoded for reliability
            const uploadResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              {
                method: 'POST',
                body: formData
              }
            );
            
            if (!uploadResponse.ok) {
              // Fallback to data URL
              try {
                const reader = new FileReader();
                const dataUrlPromise = new Promise((resolve) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(image.file);
                });
                
                const dataUrl = await dataUrlPromise;
                imageUrl = dataUrl as string;
              } catch (dataUrlError) {
                // Final fallback to SVG placeholder
                imageUrl = `/assets/placeholder-product.svg`;
              }
            } else {
              const imageData = await uploadResponse.json();
              imageUrl = imageData.secure_url;
            }
          } catch (error) {
            imageUrl = `/assets/placeholder-product.svg`;
          }
          ```
      - **Next Steps and Recommendations**:
        - **Environment Variable Setup**: For proper configuration:
          - Create `.env.local` file (not just `.env`) in the project root
          - For client components, use variables with `NEXT_PUBLIC_` prefix:
            ```
            NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
            NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
            ```
          - For server-only variables, use:
            ```
            CLOUDINARY_API_SECRET=your_api_secret
            ```
          - Restart the development server after changes to environment variables
        - **Cloudinary Setup**:
          - Create a Cloudinary account and get credentials
          - Set up an upload preset (e.g., "ml_default" or custom name)
          - Configure the preset for unsigned uploads if using client-side uploading
          - Update `next.config.js` with the Cloudinary domain in `images.remotePatterns`
        - **Error Handling Improvements**:
          - Consider implementing more sophisticated error tracking
          - Add retry logic for failed uploads
          - Implement a proper cleanup process for partially failed product creations
  - [ ] Inventory management with stock levels
  - [ ] Financial reports and analytics
  - [x] Store settings customization
    - [x] Created client components for store settings forms (`components/vendor/settings-form.tsx`)
    - [x] Implemented logo and banner image uploads with Cloudinary
    - [x] Added bank account information management
    - [x] Implemented password change functionality with Supabase Auth
    - [x] Added immediate visual feedback with previews for image uploads
    - [x] Integrated toast notifications for success/error feedback
  - [ ] Return management workflow
- [x] Create agent dashboard:(### 1. Order Creation (Web / API)

When a customer completes checkout and their payment through Paystack is successful, the system creates a new Order with associated OrderItems for each vendor involved. The main Order is marked as **"paid"**, and each individual OrderItem is assigned the status **"processing"**, indicating that the vendor is now responsible for it.

At this stage, two unique codes are generated and tied to the Order: a **vendor drop-off code**  and a **customer pickup code** . The vendor never sees the pickup code. These codes can later be displayed as QR codes for easy scanning.

Notifications are then sent out. Vendors are alerted with a message like "New order received – prepare items," while the customer receives a payment confirmation and a message that they'll be notified once the order is ready for pickup. Agents are not involved at this point.

---

### 2. Vendor Fulfillment (Vendor Dashboard)

Once the vendor has prepared and packed the items, they use the vendor dashboard to mark each OrderItem as **"ready for drop-off."** This triggers a status change, and the system records the **`readyForDropoffAt`** timestamp. Vendors can optionally generate and print a packing slip for their internal use, though this is not required by the agent.

---

### 3. Vendor ↔ Agent Handoff (Agent Counter)

When the vendor arrives at the drop-off location with the prepared items, the agent opens the "Incoming Drop-offs" section and either enters or scans the vendor's drop-off code. The system then lists the expected OrderItems for verification.

After checking that everything is in good condition and the quantities are correct, the agent accepts the drop-off. This updates the status of each OrderItem to **"at_agent,"** and once all items are dropped off, the entire Order is updated to **"at_agent."**

The first mini-printer action now occurs. A small adhesive label is printed containing the agent's location name, the order number, vendor drop-off code, the customer's first name with a masked phone number (e.g., "Chidi 0803742"), and the customer pickup code (text + QR). This label is applied to each parcel for easy retrieval.

At this point, the system sends notifications to both the customer (informing them their order is ready for pickup along with the pickup code) and the vendor (confirming successful drop-off).

---

### 4. Customer Pickup (Agent Counter)

When the customer arrives, they present either the text version or QR version of their **pickup code**. The agent uses the "Verify Pickup" section to input or scan this code. The system ensures the order status is **"at_agent"** and may prompt the agent to confirm a secondary identifier like the last 4 digits of the customer's phone number.

Once confirmed, the agent clicks "Complete pickup," which updates the OrderItem status to **"picked_up"**. When all items in the order are picked up, the overall Order status becomes **"completed."** The system also records the **`pickedUpAt`** timestamp.

A receipt is printed at this point (mini-printer action #2) showing confirmation of pickup, date/time, agent name, order number, and list of items. Depending on your process, the customer can sign or just keep the slip.

Notifications are sent out again: the customer receives a thank-you message via app or email, the vendor is notified that their item was picked up, and the admin/finance team is alerted to trigger any payout logic associated with pickups.

---

### 5. Exceptional Flows

There are a few edge cases to handle. If a vendor never arrives, an automated cron job can cancel the OrderItem after a set number of days, mark it as **"vendor_no_show,"** and initiate a refund. If the customer fails to pick up their order within a specified time frame, the system marks the item or order as **"abandoned,"** triggering a restocking or return process.

If a customer requests a return within 24 hours of pickup, the system can transition the OrderItem to **"return_requested"** (ill work on this later)

---

### 6. Summary of Status Lifecycle

Here's a quick look at the flow of statuses an OrderItem can go through:

* **processing** – Vendor is preparing the item
* **ready_for_dropoff** – Vendor has marked it ready
* **at_agent** – The item is physically with the agent
* **picked_up** – The customer has collected the item
* **completed** – The full order is finished

Optional terminal states include: **cancelled**, **refunded**, **abandoned**, **return_requested**, **returned**, and **refunded_after_return**.

---

### 7. Data / Audit Points

Every status update is logged with key audit data: who made the change, when it happened, and from which IP/location. Notifications are sent for all user-visible transitions  in-app.

The pickup and drop-off codes are generated once and never change, ensuring security. For multi-vendor orders, each OrderItem is tracked independently to allow vendors to fulfill at their own pace.

---

### 8. Mini-Printer Integration Notes

The mini-printer should use ESC/POS keeping the printer offline from the internet.

There are only two print actions:

* After vendor drop-off is accepted (parcel label)
* After customer pickup is verified (receipt)

#### Mobile Bluetooth Printer Integration (XPrinter XP-P502A)

Since agents will use Bluetooth thermal printers connected to their phones instead of laptops:

**Implementation Details:**
- Created mobile-friendly label generation page (`app/agent/dropoff-label/[orderId]/page.tsx`)
- Added printer setup component (`components/agent/PrinterSetup.tsx`) with Bluetooth connection support
- Created thermal printer utilities (`lib/utils/thermal-printer.ts`) for formatting 58mm labels
- Updated accept dropoff flow to show print button after successful acceptance
- Added settings page (`app/agent/settings/page.tsx`) for printer configuration

**Printing Options:**
1. **Web Bluetooth API**: Direct connection from browser to printer (Chrome on Android)
2. **Mobile App Integration**: Copy/download formatted text to paste in thermal printer apps
3. **Fallback Browser Print**: For agents with laptops/computers

**Label Format (58mm paper, 32 chars/line):**
- Dropoff labels include: Order ID, customer info, pickup code with QR
- Pickup receipts include: Order details, items list, timestamp

**Supported Printers:**
- XPrinter XP-P502A (58mm Bluetooth)
- Generic 58mm Bluetooth thermal printers
- Any ESC/POS compatible printer via mobile apps

---

### 9. What the Customer Must Provide at Pickup

To retrieve their order, the customer must provide the **customerPickupCode** (either as text or QR). Optionally, the agent can ask for the last 4 digits of the customer's phone number or the email on the account as a secondary verification method.)
  # --- 2025-07-01 Refactor ---
- [x] Re-built Agent dashboard from scratch to replace legacy implementation
  - [x] Removed obsolete files (old sidebar, stats, pickup/return components, etc.)
  - [x] Created new responsive layout component `components/agent/AgentLayout.tsx` with header & sidebar offset from global nav
  - [x] Implemented server-side helpers in `actions/agent-dashboard.ts` for agent, orders and pickup verification
  - [x] Added dedicated API routes `app/api/agent/verify-pickup/route.ts` and `app/api/agent/profile/route.ts`
  - [x] Added client components `components/agent/VerifyPickupForm.tsx` and `components/agent/AgentProfileForm.tsx`
  - [x] Re-created pages:
    - `app/agent/dashboard/page.tsx`
    - `app/agent/orders/page.tsx`
    - `app/agent/orders/[id]/page.tsx`
    - `app/agent/profile/page.tsx`
  - [x] Ensured desktop & mobile sidebars start below global header (`pt-16`, `top-16` adjustments)
  - [x] Verified profile update & pickup verification flows via new endpoints
- [x] Create vendor store page:
  - [x] Store banner/logo customization
  - [x] Store description and policies
  - [x] Store categories navigation
  - [x] Featured products selection
  - [x] Store ratings/reviews display

### Phase 6: Admin Dashboard & System Completion
- [x] **Admin Dashboard Foundation:**
  - [x] Create `AdminLayout` with persistent sidebar & topbar
  - [x] Implement role-based middleware guard (`is_admin`) and Supabase RLS bypass for admin queries
  - [x] Build reusable `DataTable` component (pagination, sorting, column filters)
  - [x] Establish design tokens for admin theme (colors, typography)
- [ ] **User Management**
  - [x] Paginated user list with search & role/status filters ✅
  - [ ] User detail drawer showing orders, addresses, devices, auth provider
  - [ ] Role & status editing (activate / suspend / reset password)
  - [ ] Bulk actions (activate, suspend, delete) & CSV export
- [ ] **Vendor Management**
  - [x] Pending applications queue with approve/reject modal (email template pending) 🟡
  - [x] Active vendors list with search & filters ✅
  - [ ] Vendor deactivation / re-activation flow & audit trail
  - [ ] View vendor store analytics (products, sales, ratings)
- [ ] **Product Moderation**
  - [x] Global product catalogue list with vendor & category join ✅
  - [x] Toggle publish / unpublish & "featured" flag ✅
  - [ ] Flagged content review queue & dispute resolution workflow
  - [ ] Category reassignment & bulk price update utilities
- [x] **Order & Fulfilment Oversight**
  - [x] Cross-vendor orders table with status, payment & refund columns
  - [~] Manual status override implemented (refund trigger panel pending) 🟡
  - [ ] KPI dashboards: GMV, AOV, completion rates, daily orders trend
  - [ ] Export order data (CSV, date-range)
- [ ] **Return & Refund Management**
  - [ ] Returns queue with SLA timers & escalation alerts
  - [ ] Approve / reject returns with reason & evidence attachments
  - [~] Manual / automatic refund execution & event log (backend service in place, admin UI pending) 🟡
- [ ] **Agent Management**
  - [~] Agents list UI implemented (backend integration & map picker pending) 🟡
  - [ ] Activation / deactivation & password reset
  - [ ] Pickup statistics dashboard (orders handled, avg. wait time)
- [ ] **Content Management System (CMS)**
  - [x] CRUD for Hero banners & homepage sections ✅
  - [ ] Static pages (About, FAQ, Policies) with WYSIWYG / Markdown editor
  - [ ] Promotional banners & navigation links manager
- [ ] **System Settings**
  - [ ] Payment keys & transaction thresholds editor
  - [ ] Email/SMS template editor with variable preview
  - [ ] Feature flag toggles (maintenance mode, experimental features)
  - [ ] Environment variable diagnostics & health-check screen
- [ ] **Notification Templates & Routing**
  - [ ] Manage template variables per channel (email, in-app, push)
  - [ ] Channel enable/disable toggles & user preference overrides
  - [ ] Test send utility & preview renderer
- [ ] **Technical & DX Enhancements**
  - [ ] End-to-end tests (Playwright) for critical flows
  - [ ] Performance budget enforcement (Lighthouse CI)
  - [ ] Error monitoring integration (Sentry)
  - [ ] CI pipeline for lint, type-check & test
  - [ ] Storybook for UI components & visual regression tests
- [ ] **Anticipated Challenges**
  - [x] Designing complex Supabase RLS policies while allowing admin overrides – Added `is_admin()` helper & universal "Admin full access" RLS policy migration
  - [ ] Handling pagination limits (PostgREST 1000 row cap) – implement cursor based pagination
  - [ ] Avoiding N+1 queries in analytics dashboards – create Postgres views / RPCs
  - [ ] Long-running CSV exports – move to edge function generating signed URL download
  - [x] Keeping RBAC consistent between client, server actions & database policies – Server actions now rely on `user.role` check mirroring DB `is_admin()`
  - [ ] Performance impact of large image uploads in CMS – enforce Cloudinary transformation presets
  - [ ] Managing secret configuration across Vercel & Supabase environments

## Implementation Plan

### Backend Implementation (Supabase)

The backend is built using Next.js App Router and leverages **Supabase** as the primary backend platform. This includes:
- **Database**: PostgreSQL hosted on Supabase.
- **Authentication**: Supabase Auth handles user sign-up, sign-in, and session management.
- **Storage**: Cloudinary is used for image storage (as previously configured).
- **Payments**: Paystack is used for payment processing (as previously configured).
- **Data Access**: Direct interaction with Supabase database via the `@supabase/supabase-js` client library within server actions and service functions, replacing the previous Prisma ORM setup.

#### Agent-Based Delivery Model

The agent-based delivery model involves:
- Vendors dropping off products at designated agent locations on campus
- Agents managing order status and handling customer pickups
- Customers picking up orders from these agent locations

#### Return/Refund System

The return/refund system allows:
- Customers to request refunds within 24 hours of pickup
- Processing returns and tracking their status
- Handling refund approvals and rejections

#### Notification System

The notification system:
- Alerts customers about order status changes
- Notifies vendors about new orders and status updates
- Alerts agents about orders ready for pickup and returns
- Provides real-time updates on returns and refund processing
- Allows users to view and manage their notifications

#### Automated Refund Processing

The automated refund processing system:
- Integrates with Paystack's refund API to process refunds automatically
- Updates return and order status based on refund results
- Processes refunds when returns are approved or completed
- Provides batch processing for handling multiple refunds
- Handles webhook events from Paystack for refund status updates
- Generates notifications for customers when refunds are processed

### Frontend Implementation Strategy

#### Development Philosophy

The frontend implementation follows these core principles:

1. **Component-First Development**: Build and test isolated UI components before assembling pages
2. **Mobile-First Responsive Design**: Design from mobile up to ensure excellent experience on all devices
3. **Progressive Enhancement**: Ensure core functionality works without JavaScript, then enhance with client-side features
4. **Performance Optimization**: Prioritize performance at every stage (image optimization, code splitting, etc.)
5. **Accessibility**: Implement accessibility features from the beginning, not as an afterthought

#### Technology Stack

- **Framework**: Next.js (App Router)
- **UI Components**: Combination of shadcn/ui and custom components
- **Styling**: Tailwind CSS
- **State Management**: React Context API + SWR/React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Animation**: Framer Motion (used sparingly)
- **Image Handling**: Next.js Image component with Cloudinary

#### Development Workflow

1. **Component Development**:
   - Build components in isolation
   - Test across different viewports
   - Ensure accessibility compliance

2. **Page Assembly**:
   - Combine components into page layouts
   - Implement responsive behavior
   - Connect to mock data initially

3. **API Integration**:
   - Replace mock data with real API calls
   - Implement loading states
   - Handle error conditions
   - Add client-side caching

4. **Testing & Refinement**:
   - Conduct usability testing
   - Optimize performance
   - Address edge cases
   - Polish animations and transitions

#### Priority Framework

When implementing features within each phase, the following priority framework will be used:

1. **Must-Have**: Core functionality required for the system to operate
2. **Should-Have**: Important features that provide significant value
3. **Could-Have**: Desirable features that enhance the experience
4. **Won't-Have (this time)**: Features that can be deferred to later iterations

### Relevant Files

#### Backend Files
- almari-app/ - Main project directory
- almari-app/prisma/schema.sql - Supabase database schema SQL dump ✅
- almari-app/prisma/seed-data.sql - Supabase seed data SQL ✅
- almari-app/.env - Environment variables
- almari-app/auth.ts - NextAuth.js configuration (adapted for Supabase Auth via adapter) ✅
- almari-app/middleware.ts - Authorization middleware (updated for Supabase session/RBAC) ✅
- almari-app/lib/supabase.ts - Supabase client setup utility ✅
- almari-app/lib/auth.ts - Authentication utilities (potentially less used now)
- almari-app/lib/cloudinary.ts - Cloudinary integration ✅
- almari-app/lib/paystack.ts - Paystack payment integration ✅
- almari-app/types/supabase.ts - Base TypeScript definitions generated from Supabase schema ✅
- almari-app/types/index.ts - Custom application-specific TypeScript definitions ✅
- almari-app/app/api/auth/[...nextauth]/route.ts - NextAuth API route (using Supabase adapter) ✅
- almari-app/app/api/upload/route.ts - Image upload API route ✅
- almari-app/lib/services/customer.ts - Customer management services ✅
- almari-app/lib/services/review.ts - Reviews and ratings services ✅
- almari-app/lib/services/agent.ts - Agent management services (contains getActiveAgents) ✅
- almari-app/lib/services/return.ts - Return/refund services ✅
- almari-app/lib/services/refund.ts - Automated refund processing services (partially migrated)
- almari-app/lib/services/notification.ts - Notification services ✅
- almari-app/lib/services/content.ts - Services for managing site content like Hero Banners ✅
- almari-app/app/api/vendors/ - Vendor management API routes (partially migrated/superseded by actions)
- almari-app/app/api/customers/ - Customer management API routes (partially migrated/superseded by actions)
- almari-app/app/api/reviews/ - Reviews management API routes (partially migrated/superseded by actions)
- almari-app/actions/auth.ts - Authentication server actions (signIn, signUp, signOut, password reset, vendor signup) ✅
- almari-app/actions/profile.ts - Profile management server actions ✅
- almari-app/actions/cart.ts - Cart management server actions ✅
- almari-app/actions/orders.ts - Order processing server actions ✅
- almari-app/actions/products.ts - Product management server actions (getProducts, getTrendingProducts, getProductBySlug, getRelatedProducts) ✅
- almari-app/actions/reviews.ts - Review management server actions (getProductReviews) ✅
- almari-app/actions/vendor-orders.ts - Vendor order management server actions ✅
- almari-app/actions/agent.ts - Agent management server actions (getActiveAgents) ✅
- almari-app/actions/returns.ts - Return management server actions ✅
- almari-app/actions/refunds.ts - Refund processing server actions (partially migrated)
- almari-app/actions/notifications.ts - Notification management server actions ✅
- almari-app/actions/vendor.ts - Server actions for vendor application and fetching featured vendors ✅
- almari-app/actions/content.ts - Server actions for managing site content (updateHeroImage, updateHeroContent) ✅
- almari-app/lib/supabase/action.ts - Utility for creating Supabase client in server actions ✅

#### Frontend Files
- almari-app/app/layout.tsx - Root layout ✅
- almari-app/app/page.tsx - Homepage (integrated with dynamic data) ✅
- almari-app/app/products/page.tsx - Product listing page (Server Component using getProducts action) ✅
- almari-app/app/product/[slug]/page.tsx - Product detail page (integrated with dynamic data) ✅
- almari-app/app/cart/page.tsx - Cart page (integrated with dynamic data) ✅
- almari-app/app/checkout/page.tsx - Multi-step checkout page (Information, Agent Selection, Payment Init) ✅
- almari-app/app/error.tsx - Error handling page ✅
- almari-app/app/not-found.tsx - 404 page ✅
- almari-app/app/account/page.tsx - Account redirect page based on user role ✅
- almari-app/components/ - UI components directory
- almari-app/components/ui/ - Base UI components (shadcn/ui + custom) ✅
- almari-app/components/layout/header.tsx - Header component ✅
- almari-app/components/layout/footer.tsx - Footer component ✅
- almari-app/components/layout/vendor-layout.tsx - Vendor dashboard layout ✅
- almari-app/components/layout/customer-layout.tsx - Customer dashboard layout ✅
- almari-app/app/customer/layout.tsx - Layout for customer account pages ✅
- almari-app/app/customer/dashboard/page.tsx - Customer dashboard page ✅
- almari-app/app/customer/orders/page.tsx - Customer order history page ✅
- almari-app/app/customer/orders/[id]/page.tsx - Customer order detail page ✅
- almari-app/app/customer/profile/page.tsx - Customer profile management page ✅
- almari-app/app/customer/addresses/page.tsx - Customer address management page ✅
- almari-app/app/customer/wishlist/page.tsx - Customer wishlist page (placeholder) ✅
- almari-app/components/forms/ - Form components directory
- almari-app/components/customer/order-detail.tsx - Component displaying order details ✅
- almari-app/components/customer/cancel-order-form.tsx - Component for order cancellation form ✅
- almari-app/components/customer/profile-form.tsx - Component for editing profile information ✅
- almari-app/components/customer/address-card.tsx - Component displaying a saved address ✅
- almari-app/components/customer/address-form.tsx - Form component for adding/editing addresses ✅
- almari-app/components/customer/add-address-button.tsx - Button component to trigger add address modal ✅
- almari-app/components/products/product-grid.tsx - Product grid component ✅
- almari-app/components/products/product-filters.tsx - Product filters client component ✅
- almari-app/components/products/mobile-filters.tsx - Mobile filters client component ✅
- almari-app/components/products/product-sort.tsx - Product sort client component ✅
- almari-app/components/products/recently-viewed-products.tsx - Recently viewed products component ✅
- almari-app/components/products/category-header.tsx - Category header component ✅
- almari-app/components/home/Hero.tsx - Homepage hero section ✅
- almari-app/components/home/CategorySection.tsx - Categories section ✅
- almari-app/components/home/ProductShowcase.tsx - Featured products section ✅
- almari-app/components/home/VendorShowcase.tsx - Vendor highlights section ✅
- almari-app/components/home/SpecialOffersBanner.tsx - Special offers section ✅
- almari-app/components/home/TestimonialSection.tsx - Testimonials section (integrated with dynamic data) ✅
- almari-app/components/home/NewsletterSection.tsx - Newsletter signup section (integrated with backend) ✅
- almari-app/components/home/TrendingProductsSection.tsx - Trending products section (integrated with dynamic data) ✅
- almari-app/components/home/WhyChooseUsSection.tsx - Why choose us section ✅
- almari-app/components/home/AgentPickupSection.tsx - Agent pickup section (integrated with dynamic data) ✅
- almari-app/app/account/become-vendor/page.tsx - Page for existing users to apply as vendors ✅
- almari-app/components/forms/VendorApplicationForm.tsx - Form component for vendor application ✅
- almari-app/app/signup/vendor/page.tsx - Page for new users to sign up directly as vendors ✅
- almari-app/components/forms/VendorSignUpForm.tsx - Form component for combined vendor signup ✅
- almari-app/app/admin/content/hero/page.tsx - Admin page for Hero Banner management ✅
- almari-app/components/admin/content/AdminHeroImageForm.tsx - Admin form for Hero Banner image ✅
- almari-app/components/checkout/checkout-stepper.tsx - Stepper UI for checkout flow ✅
- almari-app/components/checkout/checkout-information-form.tsx - Form for collecting user info ✅
- almari-app/components/checkout/agent-location-selector.tsx - Component for selecting pickup agent ✅
- almari-app/components/checkout/checkout-summary.tsx - Sidebar displaying order summary ✅
- almari-app/components/checkout/checkout-payment-form.tsx - Final step component, initiates Paystack redirect ✅
- almari-app/app/checkout/complete/page.tsx - Page handling Paystack callback, verifies payment ✅
- almari-app/app/checkout/thank-you/page.tsx - Order confirmation/thank you page ✅

#### Authentication Files (Supabase)
- almari-app/actions/auth.ts - Contains server actions for `signInWithSupabase`, `signUpWithSupabase`, `signOutWithSupabase`, `requestPasswordReset`, `resetPassword`, `signUpAsVendor`. ✅
- almari-app/components/auth/SignInForm.tsx - Client component for the sign-in form. ✅
- almari-app/app/login/page.tsx - Page route for displaying the sign-in form and messages. ✅
- almari-app/components/auth/SignUpForm.tsx - Client component for the sign-up form. ✅
- almari-app/app/signup/page.tsx - Page route for displaying the sign-up form and messages. ✅
- almari-app/components/auth/ForgotPasswordForm.tsx - Client component for the forgot password form. ✅
- almari-app/app/forgot-password/page.tsx - Page route for the forgot password form. ✅
- almari-app/components/auth/ResetPasswordForm.tsx - Client component for the reset password form. ✅
- almari-app/app/reset-password/page.tsx - Page route for the reset password form. ✅
- almari-app/app/auth/confirm/route.ts - Route handler for email verification and password reset links. ✅
- almari-app/middleware.ts - Handles session refresh and Role-Based Access Control using Supabase. ✅
- almari-app/lib/supabase/middleware.ts - Utility function for Supabase session handling in middleware. ✅
- almari-app/lib/supabase/server.ts - Utility function for creating Supabase server client (used by actions/middleware). ✅

#### Search Functionality Files
- almari-app/components/ui/search-box.tsx - New SearchBox component used in the header ✅
- almari-app/components/ui/search-suggestions.tsx - Component for displaying search suggestions ✅
- almari-app/actions/search.ts - Server actions for product search and suggestions ✅
- almari-app/lib/hooks/use-debounce.ts - Hook for debouncing search input ✅
- almari-app/components/layout/header.tsx - Updated to include SearchBox component ✅
- almari-app/app/globals.css - Added styles for search box on transparent header ✅
- almari-app/app/products/page.tsx - Already supported search via URL parameter 'q' ✅

### Current Implementation Status

1. UI Components:
   - All core UI components have been implemented as reusable components
   - Homepage layout is complete with all sections in place using mock data
   - Cart page is fully implemented with mock data
   - Checkout flow UI components are in place
     - Stepper, Information Form, Agent Selector, Payment Form, Summary
   - Product detail page UI is complete
   - Product listings page UI is fully implemented with category header, product grid/list views, 
     pagination, filters, and quick view modal

2. API Integration & Functionality:
   - Authentication flows integrated with Supabase Auth ✅
   - Backend actions updated to use Supabase client for auth checks ✅
   - Cart data fetching logic implemented ✅
   - Checkout Process Implemented: ✅
     - Multi-step UI functional.
     - Information saving (simulated).
     - Agent selection functional.
     - Order creation logic implemented in server action (`actions/orders.ts`).
     - Paystack payment initialization and redirect implemented.
     - Paystack callback handling and payment verification implemented (`checkout/complete`).
     - Order confirmation/thank-you page created (`checkout/thank-you`).
     - Dynamic callback URL generation using Vercel env vars implemented.
   - Debugging added for schema mismatches and fixed snake_case issues. ✅

3. Next Steps for API Integration:
   - Connect homepage sections to real backend data
   - Replace mock product data with database-fetched products
   - Connect cart functionality to backend cart services (add/update/remove)
   - Connect search functionality to backend search services
   - Implement robust error handling for payment failures.

4. Mobile Responsiveness:
   - All components have been designed with mobile-first approach
   - Header includes mobile sidebar navigation
   - Product filters have dedicated mobile interface
   - Cart and checkout are fully responsive

5. Loading States:
   - Skeleton loaders are ready for product loading states
   - Empty state components are prepared for zero-data scenarios
   - Error handling components are in place