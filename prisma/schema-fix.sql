-- Start Fresh: Drop ENUM types and Tables (CASCADE handles dependencies)
-- Enums need to be dropped first if tables using them exist
DROP TYPE IF EXISTS public."UserRole" CASCADE;
DROP TYPE IF EXISTS public."OrderStatus" CASCADE;
DROP TYPE IF EXISTS public."PaymentStatus" CASCADE;
DROP TYPE IF EXISTS public."OrderItemStatus" CASCADE;
DROP TYPE IF EXISTS public."PayoutStatus" CASCADE;
DROP TYPE IF EXISTS public."PickupStatus" CASCADE;
DROP TYPE IF EXISTS public."ReturnStatus" CASCADE;
DROP TYPE IF EXISTS public."RefundStatus" CASCADE;
DROP TYPE IF EXISTS public."NotificationType" CASCADE;
DROP TYPE IF EXISTS public.discount_type CASCADE; -- Added Coupon discount type

-- Drop tables in reverse order of dependency, or use CASCADE
DROP TABLE IF EXISTS public."Notification" CASCADE;
DROP TABLE IF EXISTS public."Return" CASCADE;
DROP TABLE IF EXISTS public."Payout" CASCADE;
DROP TABLE IF EXISTS public."CartItem" CASCADE;
DROP TABLE IF EXISTS public."Cart" CASCADE;
DROP TABLE IF EXISTS public."Review" CASCADE;
DROP TABLE IF EXISTS public."OrderItem" CASCADE;
DROP TABLE IF EXISTS public."Order" CASCADE;
DROP TABLE IF EXISTS public."ProductImage" CASCADE;
DROP TABLE IF EXISTS public."Product" CASCADE;
DROP TABLE IF EXISTS public."Category" CASCADE;
DROP TABLE IF EXISTS public."Agent" CASCADE;
DROP TABLE IF EXISTS public."Vendor" CASCADE;
DROP TABLE IF EXISTS public."Address" CASCADE; -- Added Address table drop
DROP TABLE IF EXISTS public."Customer" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."Coupon" CASCADE; -- Added Coupon table drop

-- Drop functions and triggers that might interfere with recreation
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ensure necessary extensions are enabled (like pgcrypto for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================================================
-- Create ENUM types
-- ========================================================================
CREATE TYPE public."UserRole" AS ENUM ('ADMIN', 'CUSTOMER', 'VENDOR', 'AGENT');
CREATE TYPE public."OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'READY_FOR_PICKUP'); -- Added READY_FOR_PICKUP
CREATE TYPE public."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE public."OrderItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE public."PayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE public."PickupStatus" AS ENUM ('PENDING', 'READY_FOR_PICKUP', 'PICKED_UP');
CREATE TYPE public."ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE public."RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');
CREATE TYPE public."NotificationType" AS ENUM ('ORDER_STATUS_CHANGE', 'PICKUP_READY', 'ORDER_PICKED_UP', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'REFUND_PROCESSED');
CREATE TYPE public.discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- ========================================================================
-- Helper Function for updated_at triggers
-- ========================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- Create Tables
-- ========================================================================

-- Create User table (references auth.users)
CREATE TABLE public."User" (
    "id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Use auth.users.id directly as PK
    "name" text,
    "email" text NOT NULL UNIQUE, -- Keep for quick reference, maybe sync with auth.users.email
    "role" public."UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "User_pkey" PRIMARY KEY (id)
);

-- Create trigger function to sync auth.users with public."User"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'CUSTOMER');
  
  -- Auto-create a Customer record for the new user
  INSERT INTO public."Customer" (user_id, phone_number)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for User updated_at
CREATE TRIGGER set_user_updated_at
BEFORE UPDATE ON public."User"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for User (Users can see/update their own basic info)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user select own data" ON public."User" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow user update own data" ON public."User" FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Note: Admin policies would likely bypass RLS or have specific admin roles configured in Supabase Auth.


-- Create Customer table (linked to User)
CREATE TABLE public."Customer" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid UNIQUE NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "phone_number" text, -- Renamed from 'phone' for consistency
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
CREATE INDEX idx_customer_user_id ON public."Customer"(user_id);
CREATE TRIGGER set_customer_updated_at
BEFORE UPDATE ON public."Customer"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Customer (Users can manage their own customer profile)
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user manage own customer profile" ON public."Customer" FOR ALL USING (auth.uid() = user_id);


-- Create Address table (linked to Customer)
CREATE TABLE public."Address" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" uuid NOT NULL REFERENCES public."Customer"(id) ON DELETE CASCADE,
    "address_line1" text NOT NULL,
    "address_line2" text,
    "city" text NOT NULL,
    "state_province" text NOT NULL,
    "postal_code" text NOT NULL,
    "country" text NOT NULL,
    "phone_number" text,
    "is_default" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
CREATE INDEX idx_address_customer_id ON public."Address"(customer_id);
CREATE TRIGGER set_address_updated_at
BEFORE UPDATE ON public."Address"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Address (Users manage their own addresses via customer link)
ALTER TABLE public."Address" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user manage own addresses" ON public."Address" FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public."Customer" WHERE id = public."Address".customer_id));


-- Create Vendor table (linked to User)
CREATE TABLE public."Vendor" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid UNIQUE NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "store_name" text NOT NULL, -- Renamed for consistency
    "description" text,
    "logo_url" text, -- Renamed
    "banner_url" text, -- Renamed
    "is_approved" boolean NOT NULL DEFAULT false,
    "commission_rate" numeric NOT NULL DEFAULT 0 CHECK (commission_rate >= 0), -- Renamed
    "bank_name" text, -- Renamed
    "account_number" text, -- Renamed
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
CREATE INDEX idx_vendor_user_id ON public."Vendor"(user_id);
CREATE TRIGGER set_vendor_updated_at
BEFORE UPDATE ON public."Vendor"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Vendor (Vendors manage own profile, Admins can approve/manage all)
ALTER TABLE public."Vendor" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow vendor manage own profile" ON public."Vendor" FOR ALL USING (auth.uid() = user_id);
-- Add admin policy if needed, e.g., checking a custom claim or role


-- Create Category table
CREATE TABLE public."Category" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "icon_url" text, -- Renamed
    "parent_id" uuid REFERENCES public."Category"(id) ON DELETE SET NULL,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
CREATE INDEX idx_category_parent_id ON public."Category"(parent_id);
CREATE TRIGGER set_category_updated_at
BEFORE UPDATE ON public."Category"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Category (Generally public read, admin manage)
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public."Category" FOR SELECT USING (true);
-- Add admin policies for INSERT, UPDATE, DELETE


-- Create Product table (linked to Vendor and Category)
CREATE TABLE public."Product" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "vendor_id" uuid NOT NULL REFERENCES public."Vendor"(id) ON DELETE CASCADE,
    "category_id" uuid NOT NULL REFERENCES public."Category"(id) ON DELETE RESTRICT, -- Prevent deleting category with products
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "price" numeric NOT NULL CHECK (price >= 0),
    "compare_at_price" numeric CHECK (compare_at_price >= 0), -- Renamed
    "inventory" integer NOT NULL DEFAULT 0 CHECK (inventory >= 0),
    "is_published" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Indexes and Trigger
CREATE INDEX idx_product_vendor_id ON public."Product"(vendor_id);
CREATE INDEX idx_product_category_id ON public."Product"(category_id);
CREATE TRIGGER set_product_updated_at
BEFORE UPDATE ON public."Product"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Product (Public read for published, Vendor manage own, Admin manage all)
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to published" ON public."Product" FOR SELECT USING (is_published = true);
CREATE POLICY "Allow vendor manage own products" ON public."Product" FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public."Vendor" WHERE id = public."Product".vendor_id));
-- Add admin policies


-- Create ProductImage table (linked to Product)
CREATE TABLE public."ProductImage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "product_id" uuid NOT NULL REFERENCES public."Product"(id) ON DELETE CASCADE,
    "url" text NOT NULL,
    "alt_text" text, -- Renamed
    "display_order" integer NOT NULL DEFAULT 0, -- Renamed
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
CREATE INDEX idx_productimage_product_id ON public."ProductImage"(product_id);
CREATE TRIGGER set_productimage_updated_at
BEFORE UPDATE ON public."ProductImage"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS (Inherits from Product via vendor check)
ALTER TABLE public."ProductImage" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow vendor manage own product images" ON public."ProductImage" FOR ALL
    USING (auth.uid() = (SELECT v.user_id FROM public."Vendor" v JOIN public."Product" p ON v.id = p.vendor_id WHERE p.id = public."ProductImage".product_id));
CREATE POLICY "Allow public read access to images of published products" ON public."ProductImage" FOR SELECT
    USING ((SELECT is_published FROM public."Product" WHERE id = public."ProductImage".product_id) = true);
-- Add admin policies


-- Create Agent table (linked to User)
CREATE TABLE public."Agent" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid UNIQUE NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "name" text NOT NULL, -- Agent's location name or identifier
    "email" text UNIQUE NOT NULL, -- Specific agent contact email
    "phone_number" text NOT NULL, -- Renamed
    "address_line1" text NOT NULL, -- Split address
    "address_line2" text,
    "city" text NOT NULL,
    "state_province" text NOT NULL,
    "postal_code" text NOT NULL,
    "country" text NOT NULL,
    "operating_hours" text, -- Renamed
    "capacity" integer NOT NULL DEFAULT 10 CHECK (capacity >= 0), -- Max orders they can hold
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Indexes and Trigger
CREATE INDEX idx_agent_user_id ON public."Agent"(user_id);
CREATE TRIGGER set_agent_updated_at
BEFORE UPDATE ON public."Agent"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Agent (Agents manage own, Admins manage all)
ALTER TABLE public."Agent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow agent manage own profile" ON public."Agent" FOR ALL USING (auth.uid() = user_id);
-- Add admin policies


-- Create Order table (linked to Customer and Agent)
CREATE TABLE public."Order" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" uuid NOT NULL REFERENCES public."Customer"(id) ON DELETE RESTRICT, -- Prevent deleting customer with orders
    "agent_id" uuid REFERENCES public."Agent"(id) ON DELETE SET NULL, -- Agent handling pickup
    "status" public."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" numeric NOT NULL CHECK (subtotal >= 0), -- Added subtotal
    "discount_amount" numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0), -- Added discount
    "tax_amount" numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0), -- Added tax
    "shipping_amount" numeric NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0), -- Added shipping (for potential future use)
    "total_amount" numeric NOT NULL CHECK (total_amount >= 0), -- Renamed from 'total'
    "shipping_address_id" uuid REFERENCES public."Address"(id) ON DELETE SET NULL, -- Link to specific Address if delivery exists
    "billing_address_id" uuid REFERENCES public."Address"(id) ON DELETE SET NULL, -- Optional
    "payment_status" public."PaymentStatus" NOT NULL DEFAULT 'PENDING', -- Renamed
    "payment_method" text, -- e.g., 'paystack', 'card'
    "payment_reference" text UNIQUE, -- e.g., Paystack transaction reference
    "pickup_code" text UNIQUE, -- Code for customer to collect order
    "pickup_status" public."PickupStatus" NOT NULL DEFAULT 'PENDING',
    "estimated_pickup_date" timestamptz, -- Renamed
    "actual_pickup_date" timestamptz, -- Renamed from pickupDate
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Indexes and Trigger
CREATE INDEX idx_order_customer_id ON public."Order"(customer_id);
CREATE INDEX idx_order_agent_id ON public."Order"(agent_id);
CREATE INDEX idx_order_shipping_address_id ON public."Order"(shipping_address_id);
CREATE TRIGGER set_order_updated_at
BEFORE UPDATE ON public."Order"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Order (Customer sees own, Agent sees assigned, Vendor sees items, Admin sees all)
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow customer manage own orders" ON public."Order" FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public."Customer" WHERE id = public."Order".customer_id));
CREATE POLICY "Allow agent view assigned orders" ON public."Order" FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM public."Agent" WHERE id = public."Order".agent_id));
-- Add vendor visibility policy based on OrderItem connection
-- Add admin policies


-- Create OrderItem table (linked to Order, Product, Vendor)
CREATE TABLE public."OrderItem" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" uuid NOT NULL REFERENCES public."Order"(id) ON DELETE CASCADE,
    "product_id" uuid NOT NULL REFERENCES public."Product"(id) ON DELETE RESTRICT, -- Prevent deleting product in an order
    "vendor_id" uuid NOT NULL REFERENCES public."Vendor"(id) ON DELETE RESTRICT, -- Original vendor at time of order
    "quantity" integer NOT NULL CHECK (quantity > 0),
    "price_at_purchase" numeric NOT NULL CHECK (price_at_purchase >= 0), -- Renamed from 'price'
    "status" public."OrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Indexes and Trigger
CREATE INDEX idx_orderitem_order_id ON public."OrderItem"(order_id);
CREATE INDEX idx_orderitem_product_id ON public."OrderItem"(product_id);
CREATE INDEX idx_orderitem_vendor_id ON public."OrderItem"(vendor_id);
CREATE TRIGGER set_orderitem_updated_at
BEFORE UPDATE ON public."OrderItem"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for OrderItem (Customer via Order, Vendor sees own items, Agent via Order, Admin all)
ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow customer view own order items" ON public."OrderItem" FOR SELECT
    USING (auth.uid() = (SELECT c.user_id FROM public."Customer" c JOIN public."Order" o ON c.id = o.customer_id WHERE o.id = public."OrderItem".order_id));
CREATE POLICY "Allow vendor view own order items" ON public."OrderItem" FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM public."Vendor" WHERE id = public."OrderItem".vendor_id));
CREATE POLICY "Allow agent view items in assigned orders" ON public."OrderItem" FOR SELECT
    USING (auth.uid() = (SELECT a.user_id FROM public."Agent" a JOIN public."Order" o ON a.id = o.agent_id WHERE o.id = public."OrderItem".order_id));
-- Add admin policies


-- Create Review table (linked to Customer, Product)
CREATE TABLE public."Review" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" uuid NOT NULL REFERENCES public."Customer"(id) ON DELETE CASCADE, -- If customer deleted, delete reviews
    "product_id" uuid NOT NULL REFERENCES public."Product"(id) ON DELETE CASCADE, -- If product deleted, delete reviews
    "order_id" uuid REFERENCES public."Order"(id) ON DELETE SET NULL, -- Optional: Link review to a specific order
    "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" text,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Indexes and Trigger
CREATE INDEX idx_review_customer_id ON public."Review"(customer_id);
CREATE INDEX idx_review_product_id ON public."Review"(product_id);
CREATE INDEX idx_review_order_id ON public."Review"(order_id);
-- Prevent duplicate reviews per customer per product (optional)
CREATE UNIQUE INDEX idx_review_customer_product_unique ON public."Review"(customer_id, product_id);
CREATE TRIGGER set_review_updated_at
BEFORE UPDATE ON public."Review"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Review (Public read, Customer manage own)
ALTER TABLE public."Review" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public."Review" FOR SELECT USING (true);
CREATE POLICY "Allow customer manage own reviews" ON public."Review" FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public."Customer" WHERE id = public."Review".customer_id));
-- Add admin policies for moderation


-- Create Cart table (linked to Customer)
CREATE TABLE public."Cart" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" uuid UNIQUE NOT NULL REFERENCES public."Customer"(id) ON DELETE CASCADE, -- One cart per customer
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
CREATE TRIGGER set_cart_updated_at
BEFORE UPDATE ON public."Cart"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Cart (Customer manage own)
ALTER TABLE public."Cart" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow customer manage own cart" ON public."Cart" FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public."Customer" WHERE id = public."Cart".customer_id));


-- Create CartItem table (linked to Cart, Product)
CREATE TABLE public."CartItem" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "cart_id" uuid NOT NULL REFERENCES public."Cart"(id) ON DELETE CASCADE,
    "product_id" uuid NOT NULL REFERENCES public."Product"(id) ON DELETE CASCADE, -- If product removed, remove from cart
    "quantity" integer NOT NULL CHECK (quantity > 0),
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()), -- Add timestamps
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "cartitem_cart_product_unique" UNIQUE (cart_id, product_id) -- Ensure unique product per cart
);
-- Indexes and Trigger
CREATE INDEX idx_cartitem_cart_id ON public."CartItem"(cart_id);
CREATE INDEX idx_cartitem_product_id ON public."CartItem"(product_id);
CREATE TRIGGER set_cartitem_updated_at
BEFORE UPDATE ON public."CartItem"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for CartItem (Customer manage own via Cart)
ALTER TABLE public."CartItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow customer manage own cart items" ON public."CartItem" FOR ALL
    USING (auth.uid() = (SELECT c.user_id FROM public."Customer" c JOIN public."Cart" cart ON c.id = cart.customer_id WHERE cart.id = public."CartItem".cart_id));


-- Create Payout table (linked to Vendor)
CREATE TABLE public."Payout" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "vendor_id" uuid NOT NULL REFERENCES public."Vendor"(id) ON DELETE CASCADE,
    "amount" numeric NOT NULL CHECK (amount > 0),
    "status" public."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "reference_id" text UNIQUE, -- Renamed
    "transaction_date" timestamptz, -- Renamed
    "notes" text, -- Added notes
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
CREATE INDEX idx_payout_vendor_id ON public."Payout"(vendor_id);
CREATE TRIGGER set_payout_updated_at
BEFORE UPDATE ON public."Payout"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Payout (Vendor view own, Admin manage all)
ALTER TABLE public."Payout" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow vendor view own payouts" ON public."Payout" FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM public."Vendor" WHERE id = public."Payout".vendor_id));
-- Add admin policies


-- Create Return table (linked to Order, Product, Customer, Vendor, Agent)
CREATE TABLE public."Return" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" uuid NOT NULL REFERENCES public."Order"(id) ON DELETE CASCADE, -- If order deleted, return is irrelevant
    "order_item_id" uuid UNIQUE NOT NULL REFERENCES public."OrderItem"(id) ON DELETE CASCADE, -- Link to specific item returned
    "product_id" uuid NOT NULL REFERENCES public."Product"(id) ON DELETE RESTRICT, -- Keep product info even if product deleted? Maybe SET NULL
    "customer_id" uuid NOT NULL REFERENCES public."Customer"(id) ON DELETE RESTRICT,
    "vendor_id" uuid NOT NULL REFERENCES public."Vendor"(id) ON DELETE RESTRICT,
    "agent_id" uuid REFERENCES public."Agent"(id) ON DELETE SET NULL, -- Agent who processed return (if applicable)
    "reason" text NOT NULL,
    "status" public."ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "refund_amount" numeric NOT NULL CHECK (refund_amount >= 0),
    "refund_status" public."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "request_date" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "process_date" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Indexes and Trigger
CREATE INDEX idx_return_order_id ON public."Return"(order_id);
CREATE INDEX idx_return_order_item_id ON public."Return"(order_item_id);
CREATE INDEX idx_return_customer_id ON public."Return"(customer_id);
CREATE INDEX idx_return_vendor_id ON public."Return"(vendor_id);
CREATE INDEX idx_return_agent_id ON public."Return"(agent_id);
CREATE TRIGGER set_return_updated_at
BEFORE UPDATE ON public."Return"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Return (Customer manage own, Vendor/Agent see relevant, Admin all)
ALTER TABLE public."Return" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow customer manage own returns" ON public."Return" FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public."Customer" WHERE id = public."Return".customer_id));
CREATE POLICY "Allow vendor view relevant returns" ON public."Return" FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM public."Vendor" WHERE id = public."Return".vendor_id));
CREATE POLICY "Allow agent view relevant returns" ON public."Return" FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM public."Agent" WHERE id = public."Return".agent_id));
-- Add admin policies


-- Create Notification table (linked to User, Order, Return)
CREATE TABLE public."Notification" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "type" public."NotificationType" NOT NULL,
    "reference_url" text, -- Link to order, return, product page etc.
    "order_id" uuid REFERENCES public."Order"(id) ON DELETE SET NULL,
    "return_id" uuid REFERENCES public."Return"(id) ON DELETE SET NULL,
    "is_read" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    -- No updated_at needed typically
);
-- Index
CREATE INDEX idx_notification_user_id ON public."Notification"(user_id);
-- RLS for Notification (User sees own)
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user access own notifications" ON public."Notification" FOR ALL USING (auth.uid() = user_id);


-- Create Coupon table
CREATE TABLE public."Coupon" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" text UNIQUE NOT NULL,
    "description" text,
    "discount_type" public.discount_type NOT NULL,
    "discount_value" numeric NOT NULL CHECK (discount_value > 0),
    "expiry_date" timestamptz,
    "min_purchase_amount" numeric DEFAULT 0 CHECK (min_purchase_amount >= 0),
    "usage_limit" integer,
    "usage_count" integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Index and Trigger
DROP INDEX IF EXISTS idx_coupon_code;
CREATE INDEX idx_coupon_code ON public."Coupon"(code);
CREATE TRIGGER set_coupon_updated_at
BEFORE UPDATE ON public."Coupon"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
-- RLS for Coupon (Public read active? Admin manage all)
ALTER TABLE public."Coupon" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to active coupons" ON public."Coupon" FOR SELECT USING (is_active = true);
-- Add admin policies for INSERT, UPDATE, DELETE


-- ========================================================================
-- Grant Permissions (Grant to roles used by Supabase)
-- ========================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated; -- Allow read access generally
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated; -- Allow modification for authenticated (RLS will restrict)

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role; -- Full access for postgres and service_role
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

GRANT EXECUTE ON FUNCTION public.trigger_set_timestamp() TO anon, authenticated; -- Allow roles to execute trigger function

-- Note: Review grants based on specific needs. These are broad examples.
-- RLS policies are the primary mechanism for controlling access for 'anon' and 'authenticated' roles.

-- ========================================================================
-- End of Schema Script
-- ========================================================================
