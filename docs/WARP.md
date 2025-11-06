# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Zervia is a multi-vendor e-commerce platform built with Next.js, featuring role-based access control for customers, vendors, agents, and administrators. The platform integrates with Supabase for database operations, NextAuth.js for authentication, Paystack for payments, and Cloudinary for image storage.

## Common Development Commands

### Development and Build
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server (custom Express server)
npm start

# Start with Next.js server
npm run start:next

# Lint code
npm run lint
```

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed development database
npm run db:seed

# Export seed data to SQL
npm run db:seed-sql

# Export database schema to SQL
npm run db:schema-sql

# Open Prisma Studio
npx prisma studio
```

### Specialized Services
```bash
# Start thermal printer service
npm run printer:start

# View Prisma schema
cat prisma/schema.prisma

# Check environment variables
# Ensure .env file exists with required variables
```

### Testing Individual Components
```bash
# Test specific API route
curl http://localhost:3000/api/vendors
curl http://localhost:3000/api/products

# Test authentication flow
curl -X POST http://localhost:3000/api/auth/signin

# Debug push notifications
curl http://localhost:3000/api/debug-push
```

## Architecture Overview

### Authentication & Authorization
- **Dual Authentication**: NextAuth.js with custom Prisma adapter + Supabase Auth
- **Role-Based Access**: ADMIN, CUSTOMER, VENDOR, AGENT roles with route-level protection
- **Session Management**: Server-side sessions with automatic role-based redirects
- **Key Files**: `auth.ts`, `lib/auth.ts`, `actions/auth.ts`, `lib/server/auth-adapter.ts`

### Database Architecture
- **Primary Database**: PostgreSQL hosted on Supabase
- **ORM**: Prisma with custom schema supporting multi-vendor operations
- **Connection Strategy**: Uses Supabase MCP server for all database operations (per .cursor/rules/databaseop.mdc)
- **Key Models**: User, Vendor, Product, InventoryTransaction with role-based relationships

### Frontend Architecture
- **App Router**: Next.js 15 with TypeScript, using app directory structure
- **State Management**: Jotai for global state, Context providers for auth/cart
- **UI Components**: Radix UI primitives with Tailwind CSS and custom design system
- **Layout Strategy**: Conditional layouts based on user roles and routes

### API Architecture
- **Server Actions**: Primary method for database operations and form handling
- **API Routes**: RESTful endpoints in `app/api/` for external integrations
- **Route Protection**: Role-based middleware and server-side auth checks
- **Key Patterns**: Server Components for data fetching, Client Components for interactivity

### Role-Based Route Structure
```
/admin/*     - Administrative functions (user/vendor management, analytics)
/vendor/*    - Vendor dashboard (product management, orders, payouts)
/agent/*     - Agent operations (pickup locations, order fulfillment)
/customer/*  - Customer features (browsing, cart, orders)
/(auth)/*    - Authentication flows with grouped routes
```

### External Integrations
- **Paystack**: Payment processing with webhook handlers
- **Cloudinary**: Image upload and optimization
- **Web Push**: Real-time notifications system
- **Thermal Printing**: Custom printer service for order labels

### Development Patterns
- **Server-First**: Database operations happen server-side only
- **Type Safety**: Full TypeScript integration with Prisma-generated types
- **Security**: CSRF protection, role validation, and secure credential handling
- **Performance**: Turbopack for fast development, optimized production builds

### Configuration Files
- `next.config.ts` - Next.js configuration
- `tailwind.config.js` - Custom design system with Zervia branding
- `prisma/schema.prisma` - Database schema with multi-tenant support
- `server.js` - Custom Express server for production deployment

### Environment Requirements
- Node.js >=18.x
- PostgreSQL database (via Supabase)
- Required environment variables: DATABASE_URL, NEXTAUTH_SECRET, PAYSTACK keys, CLOUDINARY credentials

## Database Operation Rules

When working with the database, always use the Supabase MCP (Multi-Cloud Platform) server that has been installed:
- Connect through the Supabase MCP server instead of direct database access
- This applies to all database checks, reads, writes, and administrative operations
- Benefits include consistent security policies, connection pooling, built-in caching, real-time capabilities, Row Level Security enforcement, and audit logging

## Key Development Notes

### Dual Authentication System
The platform uses both NextAuth.js and Supabase Auth in parallel. When modifying authentication:
- NextAuth.js handles session management and role-based routing
- Supabase Auth provides additional security and real-time features
- Both systems must be updated for user registration/login changes

### Role-Based Development
Each user role has distinct capabilities:
- Route access is controlled by middleware and server components
- UI components conditionally render based on user roles
- API endpoints validate roles before processing requests
- Database queries include role-based filtering where applicable

### Production Deployment
- Uses custom Express server (`server.js`) instead of default Next.js server
- Requires `vercel-build` script for Vercel deployment with Prisma generation
- Includes `cpanel-build` for alternative hosting environments
- Environment variables must be configured for all external services