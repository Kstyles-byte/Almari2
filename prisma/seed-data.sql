-- Clean up existing data
DELETE FROM "Notification";
DELETE FROM "Return";
DELETE FROM "OrderItem";
DELETE FROM "Order";
DELETE FROM "CartItem";
DELETE FROM "Cart";
DELETE FROM "Review";
DELETE FROM "ProductImage";
DELETE FROM "Product";
DELETE FROM "Payout";
DELETE FROM "Agent";
DELETE FROM "Vendor";
DELETE FROM "Customer";
DELETE FROM "Category";
-- DELETE FROM "User";

-- Create categories
INSERT INTO "Category" (id, name, slug, icon, "createdAt", "updatedAt") VALUES (
      'category-id-1',
      'Electronics',
      'electronics',
      '📱',
      NOW(),
      NOW()
    );
INSERT INTO "Category" (id, name, slug, icon, "createdAt", "updatedAt") VALUES (
      'category-id-2',
      'Fashion',
      'fashion',
      '👕',
      NOW(),
      NOW()
    );
INSERT INTO "Category" (id, name, slug, icon, "createdAt", "updatedAt") VALUES (
      'category-id-3',
      'Books',
      'books',
      '📚',
      NOW(),
      NOW()
    );
INSERT INTO "Category" (id, name, slug, icon, "createdAt", "updatedAt") VALUES (
      'category-id-4',
      'Food',
      'food',
      '🍔',
      NOW(),
      NOW()
    );
INSERT INTO "Category" (id, name, slug, icon, "createdAt", "updatedAt") VALUES (
      'category-id-5',
      'Beauty',
      'beauty',
      '💄',
      NOW(),
      NOW()
    );

-- Create Vendors (Using provided UUIDs)
INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES
      ('vendor-id-1', 'e6280ca3-a9ae-4edf-9fd6-ac75ce0538c6', 'Tech Haven', 'Your one-stop shop for all tech gadgets', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 10, 'GTBank', '0123456789', NOW(), NOW()),
      ('vendor-id-2', '028a6914-6de7-4639-835b-b82413f761cb', 'Style Studio', 'Trendy fashion for students', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 12, 'First Bank', '9876543210', NOW(), NOW()),
      ('vendor-id-3', '8753940b-8401-42fd-8ee1-867670a16d8c', 'Campus Eats', 'Delicious food delivered to your hostel', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 15, 'Access Bank', '5678901234', NOW(), NOW());

-- Create Products (Linked to the Vendors above)
INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES
    ('tech-product-id-1', 'vendor-id-1', 'Wireless Earbuds', 'wireless-earbuds', 'High-quality wireless earbuds with noise cancellation', 15000, 18000, 'category-id-1', 50, TRUE, NOW(), NOW()),
    ('fashion-product-id-1', 'vendor-id-2', 'Campus Hoodie', 'campus-hoodie', 'Comfortable and stylish hoodie for students', 8000, 10000, 'category-id-2', 100, TRUE, NOW(), NOW()),
    ('food-product-id-1', 'vendor-id-3', 'Jollof Rice Combo', 'jollof-rice-combo', 'Delicious Jollof rice with chicken and plantain', 1500, NULL, 'category-id-4', 200, TRUE, NOW(), NOW()),
    ('tech-product-id-2', 'vendor-id-1', 'Portable Power Bank', 'portable-power-bank', '10000mAh power bank for charging on the go', 5000, 6000, 'category-id-1', 75, TRUE, NOW(), NOW());

-- Create ProductImages (Linked to Products above)
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES
    ('tech-product-id-1-image-1', 'tech-product-id-1', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Wireless Earbuds Image 1', 1, NOW(), NOW()),
    ('tech-product-id-1-image-2', 'tech-product-id-1', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Wireless Earbuds Image 2', 2, NOW(), NOW()),
    ('fashion-product-id-1-image-1', 'fashion-product-id-1', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Campus Hoodie', 1, NOW(), NOW()),
    ('food-product-id-1-image-1', 'food-product-id-1', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Jollof Rice Combo', 1, NOW(), NOW()),
    ('tech-product-id-2-image-1', 'tech-product-id-2', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Portable Power Bank', 1, NOW(), NOW());

-- Create Customers (Using provided UUIDs)
INSERT INTO "Customer" (id, "userId", phone, address, hostel, room, college, "createdAt", "updatedAt") VALUES
    ('customer-id-1', 'fe1a1fec-5268-479c-9b74-73276afcd0b4', '08123456789', 'Block A', 'Unity Hall', 'A112', 'Engineering', NOW(), NOW());
-- Add more customers if needed, ensure you have corresponding users in auth.users

-- Create Agents (Using provided UUIDs)
INSERT INTO "Agent" (id, "userId", name, email, phone, location, "operatingHours", capacity, isActive, "createdAt", "updatedAt") VALUES
    ('agent-id-1', 'e43aa252-0c23-4d22-973d-6e0e844352df', 'Campus Pickup Point A', 'agent.a@example.com', '09011112222', 'Student Union Building', '9am - 5pm', 50, TRUE, NOW(), NOW());
-- Add more agents if needed

-- Create Reviews (Linked to Customers and Products)
INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES
    ('review-id-1', 'customer-id-1', 'tech-product-id-1', 5, 'Great earbuds, excellent sound quality!', NOW(), NOW()),
    ('review-id-2', 'customer-id-1', 'fashion-product-id-1', 4, 'Nice hoodie, very comfortable.', NOW(), NOW());
-- Add more reviews

-- Create Orders (Linked to Customers, Agents, and potentially using products)
INSERT INTO "Order" (id, "customerId", "agentId", status, total, shippingAddress, "paymentStatus", "paymentReference", "pickupCode", "pickupStatus", "pickupDate", "createdAt", "updatedAt") VALUES
    ('order-id-1', 'customer-id-1', 'agent-id-1', 'DELIVERED', 15000, 'Block A, Unity Hall, A112, Engineering', 'COMPLETED', 'PAY-123456', '123456', 'PICKED_UP', NOW() - INTERVAL '7 DAYS', NOW() - INTERVAL '8 DAYS', NOW() - INTERVAL '7 DAYS'),
    ('order-id-2', 'customer-id-1', 'agent-id-1', 'PENDING', 8000, 'Block A, Unity Hall, A112, Engineering', 'PENDING', 'PAY-789012', '654321', 'PENDING', NULL, NOW(), NOW());

-- Create OrderItems (Linked to Orders and Products)
INSERT INTO "OrderItem" (id, "orderId", "productId", "vendorId", quantity, price, status, "createdAt", "updatedAt") VALUES
    ('order-item-1', 'order-id-1', 'tech-product-id-1', 'vendor-id-1', 1, 15000, 'DELIVERED', NOW() - INTERVAL '8 DAYS', NOW() - INTERVAL '7 DAYS'),
    ('order-item-2', 'order-id-2', 'fashion-product-id-1', 'vendor-id-2', 1, 8000, 'PENDING', NOW(), NOW());
-- Note: Ensure prices match the Order total

-- Create Returns (Linked to Orders, Products, Customers, Vendors, Agents)
-- Ensure the order exists and makes sense for a return
INSERT INTO "Return" (id, "orderId", "productId", "customerId", "vendorId", "agentId", reason, status, "refundAmount", "refundStatus", "requestDate", "processDate", "createdAt", "updatedAt") VALUES
    ('return-id-1', 'order-id-1', 'tech-product-id-1', 'customer-id-1', 'vendor-id-1', 'agent-id-1', 'Item not as described', 'APPROVED', 15000, 'PROCESSED', NOW() - INTERVAL '5 DAYS', NOW() - INTERVAL '3 DAYS', NOW() - INTERVAL '5 DAYS', NOW() - INTERVAL '3 DAYS');

-- Create Notifications (Linked to Users, Orders, Returns)
INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "returnId", "isRead", "createdAt") VALUES
    ('notification-id-1', 'fe1a1fec-5268-479c-9b74-73276afcd0b4', 'Order Delivered', 'Your order #order-id-1 has been delivered successfully', 'ORDER_STATUS_CHANGE', 'order-id-1', NULL, TRUE, NOW() - INTERVAL '7 DAYS'),
    ('notification-id-2', 'fe1a1fec-5268-479c-9b74-73276afcd0b4', 'Return Approved', 'Your return request for order #order-id-1 has been approved.', 'RETURN_APPROVED', NULL, 'return-id-1', FALSE, NOW() - INTERVAL '3 DAYS'),
    ('notification-id-3', 'e6280ca3-a9ae-4edf-9fd6-ac75ce0538c6', 'New Return Request', 'A return has been requested for product tech-product-id-1 from order #order-id-1.', 'RETURN_REQUESTED', 'order-id-1', 'return-id-1', FALSE, NOW() - INTERVAL '5 DAYS');
-- Add more notifications as needed

-- Seed Carts and CartItems (Optional, depends on use case)
/*
INSERT INTO "Cart" (id, "customerId", "createdAt", "updatedAt") VALUES
    ('cart-id-1', 'customer-id-1', NOW(), NOW());

INSERT INTO "CartItem" (id, "cartId", "productId", quantity) VALUES
    ('cart-item-1', 'cart-id-1', 'tech-product-id-2', 1),
    ('cart-item-2', 'cart-id-1', 'food-product-id-1', 2);
*/

-- Seed Payouts (Optional, depends on use case)
/*
INSERT INTO "Payout" (id, "vendorId", amount, status, reference, "createdAt", "updatedAt") VALUES
    ('payout-id-1', 'vendor-id-1', 13500, 'COMPLETED', 'PAYOUT-REF-1', NOW() - INTERVAL '2 DAYS', NOW() - INTERVAL '1 DAY'); -- Assuming 10% commission on 15000
*/