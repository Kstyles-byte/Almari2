-- Clean up existing data (Optional, but good for repeatable seeding)
-- Order matters due to dependencies if not using CASCADE in schema drops
DELETE FROM public."Notification";
DELETE FROM public."Return";
DELETE FROM public."OrderItem";
DELETE FROM public."Order";
DELETE FROM public."CartItem";
DELETE FROM public."Cart";
DELETE FROM public."Review";
DELETE FROM public."ProductImage";
DELETE FROM public."Product";
DELETE FROM public."Payout";
DELETE FROM public."Agent";
DELETE FROM public."Vendor";
DELETE FROM public."Address"; -- Added Address cleanup
DELETE FROM public."Customer";
DELETE FROM public."Category";
DELETE FROM public."Coupon"; -- Added Coupon cleanup
-- No explicit DELETE needed for public."User" as it mirrors auth.users mostly

-- ========================================================================
-- Seed Users into public."User" table (MUST CORRESPOND TO auth.users)
-- ========================================================================
-- Ensure these emails match the ones in your auth.users table for consistency
INSERT INTO public."User" (id, email, name, role, created_at, updated_at) VALUES
    ('e542aa9a-06f7-49dc-b466-3cdca7947ce5', 'admin@example.com', 'Admin User', 'ADMIN', NOW(), NOW()), -- Replace email
    ('fe1a1fec-5268-479c-9b74-73276afcd0b4', 'customer@example.com', 'Customer User', 'CUSTOMER', NOW(), NOW()), -- Replace email
    ('e6280ca3-a9ae-4edf-9fd6-ac75ce0538c6', 'vendor1@example.com', 'Vendor User 1', 'VENDOR', NOW(), NOW()), -- Replace email
    ('028a6914-6de7-4639-835b-b82413f761cb', 'vendor2@example.com', 'Vendor User 2', 'VENDOR', NOW(), NOW()), -- Replace email
    ('8753940b-8401-42fd-8ee1-867670a16d8c', 'vendor3@example.com', 'Vendor User 3', 'VENDOR', NOW(), NOW()), -- Replace email
    ('e43aa252-0c23-4d22-973d-6e0e844352df', 'agent@example.com', 'Agent User', 'AGENT', NOW(), NOW()) -- Replace email
ON CONFLICT (id) DO NOTHING; -- Optional: Prevents error if user already exists in public."User"


-- ========================================================================
-- Seed Other Data (Using UUIDs)
-- ========================================================================

-- Create categories
INSERT INTO public."Category" (id, name, slug, icon_url, created_at, updated_at) VALUES
    ('f8c3b3f7-8f7a-4b3e-8e4a-5a6b7c8d9e0f', 'Electronics', 'electronics', '📱', NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Fashion', 'fashion', '👕', NOW(), NOW()),
    ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'Books', 'books', '📚', NOW(), NOW()),
    ('c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'Food', 'food', '🍔', NOW(), NOW()),
    ('d4e5f6a7-b8c9-0123-4567-890abcdef012', 'Beauty', 'beauty', '💄', NOW(), NOW());

-- Create Vendors (Linking to existing auth users via user_id)
INSERT INTO public."Vendor" (id, user_id, store_name, description, logo_url, banner_url, is_approved, commission_rate, bank_name, account_number, created_at, updated_at) VALUES
    ('1a2b3c4d-5e6f-7890-1234-567890abcdef', 'e6280ca3-a9ae-4edf-9fd6-ac75ce0538c6', 'Tech Haven', 'Your one-stop shop for all tech gadgets', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 10, 'GTBank', '0123456789', NOW(), NOW()),
    ('2b3c4d5e-6f7a-8901-2345-67890abcdef0', '028a6914-6de7-4639-835b-b82413f761cb', 'Style Studio', 'Trendy fashion for students', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 12, 'First Bank', '9876543210', NOW(), NOW()),
    ('3c4d5e6f-7a8b-9012-3456-7890abcdef01', '8753940b-8401-42fd-8ee1-867670a16d8c', 'Campus Eats', 'Delicious food delivered to your hostel', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 15, 'Access Bank', '5678901234', NOW(), NOW());

-- Create Products (Linked to the Vendors above)
INSERT INTO public."Product" (id, vendor_id, name, slug, description, price, compare_at_price, category_id, inventory, is_published, created_at, updated_at) VALUES
    ('4d5e6f7a-8b9c-0123-4567-890abcdef012', '1a2b3c4d-5e6f-7890-1234-567890abcdef', 'Wireless Earbuds', 'wireless-earbuds-' || substring(gen_random_uuid()::text from 1 for 8), 'High-quality wireless earbuds with noise cancellation', 15000, 18000, 'f8c3b3f7-8f7a-4b3e-8e4a-5a6b7c8d9e0f', 50, TRUE, NOW(), NOW()),
    ('5e6f7a8b-9c0d-1234-5678-90abcdef0123', '2b3c4d5e-6f7a-8901-2345-67890abcdef0', 'Campus Hoodie', 'campus-hoodie-' || substring(gen_random_uuid()::text from 1 for 8), 'Comfortable and stylish hoodie for students', 8000, 10000, 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 100, TRUE, NOW(), NOW()),
    ('6f7a8b9c-0d1e-2345-6789-0abcdef01234', '3c4d5e6f-7a8b-9012-3456-7890abcdef01', 'Jollof Rice Combo', 'jollof-rice-combo-' || substring(gen_random_uuid()::text from 1 for 8), 'Delicious Jollof rice with chicken and plantain', 1500, NULL, 'c3d4e5f6-a7b8-9012-3456-7890abcdef01', 200, TRUE, NOW(), NOW()),
    ('7a8b9c0d-1e2f-3456-7890-abcdef012345', '1a2b3c4d-5e6f-7890-1234-567890abcdef', 'Portable Power Bank', 'portable-power-bank-' || substring(gen_random_uuid()::text from 1 for 8), '10000mAh power bank for charging on the go', 5000, 6000, 'f8c3b3f7-8f7a-4b3e-8e4a-5a6b7c8d9e0f', 75, TRUE, NOW(), NOW());

-- Create ProductImages (Linked to Products above)
INSERT INTO public."ProductImage" (id, product_id, url, alt_text, display_order, created_at, updated_at) VALUES
    (gen_random_uuid(), '4d5e6f7a-8b9c-0123-4567-890abcdef012', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Wireless Earbuds Image 1', 1, NOW(), NOW()),
    (gen_random_uuid(), '4d5e6f7a-8b9c-0123-4567-890abcdef012', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Wireless Earbuds Image 2', 2, NOW(), NOW()),
    (gen_random_uuid(), '5e6f7a8b-9c0d-1234-5678-90abcdef0123', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Campus Hoodie', 1, NOW(), NOW()),
    (gen_random_uuid(), '6f7a8b9c-0d1e-2345-6789-0abcdef01234', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Jollof Rice Combo', 1, NOW(), NOW()),
    (gen_random_uuid(), '7a8b9c0d-1e2f-3456-7890-abcdef012345', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Portable Power Bank', 1, NOW(), NOW());

-- Create Customers (Linking to existing auth user)
INSERT INTO public."Customer" (id, user_id, phone_number, created_at, updated_at) VALUES
    ('8b9c0d1e-2f3a-4567-8901-bcdef0123456', 'fe1a1fec-5268-479c-9b74-73276afcd0b4', '08123456789', NOW(), NOW());

-- Create Addresses for the Customer
INSERT INTO public."Address" (id, customer_id, address_line1, city, state_province, postal_code, country, is_default, created_at, updated_at) VALUES
    (gen_random_uuid(), '8b9c0d1e-2f3a-4567-8901-bcdef0123456', 'Block A, Unity Hall', 'Ife', 'Osun', '220005', 'Nigeria', TRUE, NOW(), NOW());

-- Create Agents (Linking to existing auth user)
INSERT INTO public."Agent" (id, user_id, name, email, phone_number, address_line1, city, state_province, postal_code, country, operating_hours, capacity, is_active, created_at, updated_at) VALUES
    ('9c0d1e2f-3a4b-5678-9012-cdef01234567', 'e43aa252-0c23-4d22-973d-6e0e844352df', 'Campus Pickup Point A', 'agent.a@example.com', '09011112222', 'Student Union Building', 'Ife', 'Osun', '220005', 'Nigeria', '9am - 5pm', 50, TRUE, NOW(), NOW());

-- Create Reviews (Linked to Customers and Products)
INSERT INTO public."Review" (id, customer_id, product_id, rating, comment, created_at, updated_at) VALUES
    ('a1b2c3d4-e5f6-7890-1234-def012345678', '8b9c0d1e-2f3a-4567-8901-bcdef0123456', '4d5e6f7a-8b9c-0123-4567-890abcdef012', 5, 'Great earbuds, excellent sound quality!', NOW(), NOW()),
    ('b2c3d4e5-f6a7-8901-2345-ef0123456789', '8b9c0d1e-2f3a-4567-8901-bcdef0123456', '5e6f7a8b-9c0d-1234-5678-90abcdef0123', 4, 'Nice hoodie, very comfortable.', NOW(), NOW());

-- Create Orders (Linked to Customers, Agents)
INSERT INTO public."Order" (id, customer_id, agent_id, status, subtotal, discount_amount, tax_amount, shipping_amount, total_amount, payment_status, payment_reference, pickup_code, pickup_status, actual_pickup_date, created_at, updated_at) VALUES
    ('c3d4e5f6-a7b8-9012-3456-f01234567890', '8b9c0d1e-2f3a-4567-8901-bcdef0123456', '9c0d1e2f-3a4b-5678-9012-cdef01234567', 'DELIVERED', 15000, 0, 0, 0, 15000, 'COMPLETED', 'PAY-123456-' || substring(gen_random_uuid()::text from 1 for 6), 'PU-' || substring(gen_random_uuid()::text from 1 for 6), 'PICKED_UP', NOW() - INTERVAL '7 DAYS', NOW() - INTERVAL '8 DAYS', NOW() - INTERVAL '7 DAYS'),
    ('d4e5f6a7-b8c9-0123-4567-012345678901', '8b9c0d1e-2f3a-4567-8901-bcdef0123456', '9c0d1e2f-3a4b-5678-9012-cdef01234567', 'PENDING', 8000, 0, 0, 0, 8000, 'PENDING', 'PAY-789012-' || substring(gen_random_uuid()::text from 1 for 6), 'PU-' || substring(gen_random_uuid()::text from 1 for 6), 'PENDING', NULL, NOW(), NOW());

-- Create OrderItems (Linked to Orders and Products)
-- Assign a specific UUID to the OrderItem we want to return
INSERT INTO public."OrderItem" (id, order_id, product_id, vendor_id, quantity, price_at_purchase, status, created_at, updated_at) VALUES
    ('a0e1b2c3-d4f5-4a6b-8c7d-9e0f1a2b3c4d', 'c3d4e5f6-a7b8-9012-3456-f01234567890', '4d5e6f7a-8b9c-0123-4567-890abcdef012', '1a2b3c4d-5e6f-7890-1234-567890abcdef', 1, 15000, 'DELIVERED', NOW() - INTERVAL '8 DAYS', NOW() - INTERVAL '7 DAYS'), -- Use a known UUID for the item to be returned
    (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-4567-012345678901', '5e6f7a8b-9c0d-1234-5678-90abcdef0123', '2b3c4d5e-6f7a-8901-2345-67890abcdef0', 1, 8000, 'PENDING', NOW(), NOW()); -- Item for order 2


-- Create Returns (Linked to Orders, OrderItems, Products, Customers, Vendors, Agents)
-- Use the SAME known UUID for order_item_id as inserted above
INSERT INTO public."Return" (id, order_id, order_item_id, product_id, customer_id, vendor_id, agent_id, reason, status, refund_amount, refund_status, request_date, process_date, created_at, updated_at) VALUES
    ('e5f6a7b8-c9d0-1234-5678-123456789012', 'c3d4e5f6-a7b8-9012-3456-f01234567890', 'a0e1b2c3-d4f5-4a6b-8c7d-9e0f1a2b3c4d', '4d5e6f7a-8b9c-0123-4567-890abcdef012', '8b9c0d1e-2f3a-4567-8901-bcdef0123456', '1a2b3c4d-5e6f-7890-1234-567890abcdef', '9c0d1e2f-3a4b-5678-9012-cdef01234567', 'Item not as described', 'APPROVED', 15000, 'PROCESSED', NOW() - INTERVAL '5 DAYS', NOW() - INTERVAL '3 DAYS', NOW() - INTERVAL '5 DAYS', NOW() - INTERVAL '3 DAYS'); -- Use the known OrderItem ID

-- Create Notifications (Linked to Users, Orders, Returns)
INSERT INTO public."Notification" (id, user_id, title, message, type, order_id, return_id, is_read, created_at) VALUES
    ('f6a7b8c9-d0e1-2345-6789-234567890123', 'fe1a1fec-5268-479c-9b74-73276afcd0b4', 'Order Delivered', 'Your order #c3d4e5f6... has been delivered successfully', 'ORDER_STATUS_CHANGE', 'c3d4e5f6-a7b8-9012-3456-f01234567890', NULL, TRUE, NOW() - INTERVAL '7 DAYS'),
    ('a7b8c9d0-e1f2-3456-7890-345678901234', 'fe1a1fec-5268-479c-9b74-73276afcd0b4', 'Return Approved', 'Your return request for order #c3d4e5f6... has been approved.', 'RETURN_APPROVED', NULL, 'e5f6a7b8-c9d0-1234-5678-123456789012', FALSE, NOW() - INTERVAL '3 DAYS'),
    ('b8c9d0e1-f2a3-4567-8901-456789012345', 'e6280ca3-a9ae-4edf-9fd6-ac75ce0538c6', 'New Return Request', 'A return has been requested for product Wireless Earbuds from order #c3d4e5f6....', 'RETURN_REQUESTED', 'c3d4e5f6-a7b8-9012-3456-f01234567890', 'e5f6a7b8-c9d0-1234-5678-123456789012', FALSE, NOW() - INTERVAL '5 DAYS');

-- Seed Coupons
INSERT INTO public."Coupon" (id, code, description, discount_type, discount_value, expiry_date, min_purchase_amount, usage_limit, is_active, created_at, updated_at) VALUES
    (gen_random_uuid(), 'WELCOME10', '10% off first order', 'PERCENTAGE', 10, NULL, 0, 1, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'SAVE500', '₦500 off orders over ₦5000', 'FIXED_AMOUNT', 500, NOW() + INTERVAL '30 DAYS', 5000, NULL, TRUE, NOW(), NOW());

-- Generate drop-off tokens for rows that don’t have one yet
UPDATE public."Order"
SET    dropoff_code = 'D-' || substring(gen_random_uuid()::text FROM 1 FOR 6)
WHERE  dropoff_code IS NULL;
-- ========================================================================
-- End of Seed Script
-- ========================================================================