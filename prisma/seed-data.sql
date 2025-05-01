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
DELETE FROM "User";

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

-- Create products (These Vendors won't exist until seeded correctly)
-- For now, these inserts will likely fail due to missing vendor foreign keys
-- Commenting them out until Vendor seeding is addressed.
/*
INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES
      ('vendor-id-1', 'REPLACE_WITH_TECH_VENDOR_UUID', 'Tech Haven', 'Your one-stop shop for all tech gadgets', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 10, 'GTBank', '0123456789', NOW(), NOW());
INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES
      ('vendor-id-2', 'REPLACE_WITH_FASHION_VENDOR_UUID', 'Style Studio', 'Trendy fashion for students', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 12, 'First Bank', '9876543210', NOW(), NOW());
INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES
      ('vendor-id-3', 'REPLACE_WITH_FOOD_VENDOR_UUID', 'Campus Eats', 'Delicious food delivered to your hostel', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', TRUE, 15, 'Access Bank', '5678901234', NOW(), NOW());

INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES
    ('tech-product-id-1', 'vendor-id-1', 'Wireless Earbuds', 'wireless-earbuds', 'High-quality wireless earbuds with noise cancellation', 15000, 18000, 'category-id-1', 50, TRUE, NOW(), NOW());
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES ('tech-product-id-1-image-1', 'tech-product-id-1', 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'Wireless Earbuds', 1, NOW(), NOW());
-- ... other products ...
*/

-- Create reviews (These Customers/Products won't exist until seeded correctly)
-- Commenting out until Customer/Product seeding is addressed.
/*
INSERT INTO "Customer" (id, "userId", phone, address, hostel, room, college, "createdAt", "updatedAt") VALUES
    ('customer-id-1', 'REPLACE_WITH_JOHN_UUID', '08123456789', 'Block A', 'Unity Hall', 'A112', 'Engineering', NOW(), NOW());
-- ... other customers ...

INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES
    ('review-id-1', 'customer-id-1', 'tech-product-id-1', 5, 'Great earbuds, excellent sound quality!', NOW(), NOW());
-- ... other reviews ...
*/

-- Create orders (These Customers/Agents/Products won't exist until seeded correctly)
-- Commenting out until related seeding is addressed.
/*
INSERT INTO "Order" (id, "customerId", "agentId", status, total, "paymentStatus", "paymentReference", "pickupCode", "pickupStatus", "pickupDate", "createdAt", "updatedAt") VALUES
    ('order-id-1', 'customer-id-1', 'agent-id-1', 'DELIVERED', 15000, 'COMPLETED', 'PAY-123456', '123456', 'PICKED_UP', NOW() - INTERVAL '7 DAYS', NOW(), NOW());
-- ... other orders and items ...
*/

-- Create return (Depends on orders etc)
-- Commenting out
/*
INSERT INTO "Return" (id, "orderId", "productId", "customerId", "vendorId", "agentId", reason, status, "refundAmount", "refundStatus", "requestDate", "processDate", "createdAt", "updatedAt") VALUES
    ('return-id-1', 'order-id-1', 'tech-product-id-1', 'customer-id-1', 'vendor-id-1', 'agent-id-1', 'Item not as described', 'APPROVED', 15000, 'PROCESSED', NOW() - INTERVAL '5 DAYS', NOW() - INTERVAL '3 DAYS', NOW(), NOW());
*/

-- Create notifications (Depends on users etc)
-- Commenting out
/*
INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "isRead", "createdAt") VALUES
    ('notification-id-1', 'REPLACE_WITH_CUSTOMER1_UUID', 'Order Delivered', 'Your order has been delivered successfully', 'ORDER_STATUS_CHANGE', 'order-id-1', TRUE, NOW());
-- ... other notifications ...
*/