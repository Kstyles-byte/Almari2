-- Add Wishlist Tables to Schema
-- This file adds a Wishlist table and WishlistItem table to store customer wishlists

-- Drop existing tables if they exist (for idempotency)
DROP TABLE IF EXISTS public."WishlistItem" CASCADE;
DROP TABLE IF EXISTS public."Wishlist" CASCADE;

-- Create Wishlist table (linked to Customer)
CREATE TABLE public."Wishlist" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customer_id" uuid UNIQUE NOT NULL REFERENCES public."Customer"(id) ON DELETE CASCADE, -- One wishlist per customer
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index and Trigger for Wishlist
CREATE INDEX idx_wishlist_customer_id ON public."Wishlist"(customer_id);
CREATE TRIGGER set_wishlist_updated_at
BEFORE UPDATE ON public."Wishlist"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS for Wishlist (Customer manage own)
ALTER TABLE public."Wishlist" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow customer manage own wishlist" ON public."Wishlist" FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public."Customer" WHERE id = public."Wishlist".customer_id));

-- Create WishlistItem table (linked to Wishlist and Product)
CREATE TABLE public."WishlistItem" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "wishlist_id" uuid NOT NULL REFERENCES public."Wishlist"(id) ON DELETE CASCADE,
    "product_id" uuid NOT NULL REFERENCES public."Product"(id) ON DELETE CASCADE, -- If product removed, remove from wishlist
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "wishlistitem_wishlist_product_unique" UNIQUE (wishlist_id, product_id) -- Ensure unique product per wishlist
);

-- Indexes and Trigger for WishlistItem
CREATE INDEX idx_wishlistitem_wishlist_id ON public."WishlistItem"(wishlist_id);
CREATE INDEX idx_wishlistitem_product_id ON public."WishlistItem"(product_id);
CREATE TRIGGER set_wishlistitem_updated_at
BEFORE UPDATE ON public."WishlistItem"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS for WishlistItem (Customer manage own via Wishlist)
ALTER TABLE public."WishlistItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow customer manage own wishlist items" ON public."WishlistItem" FOR ALL
    USING (auth.uid() = (SELECT c.user_id FROM public."Customer" c JOIN public."Wishlist" w ON c.id = w.customer_id WHERE w.id = public."WishlistItem".wishlist_id));

-- Grant permissions
GRANT ALL PRIVILEGES ON public."Wishlist" TO postgres, service_role;
GRANT ALL PRIVILEGES ON public."WishlistItem" TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Wishlist" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."WishlistItem" TO authenticated; 