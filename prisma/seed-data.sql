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

-- Create admin user
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
    'admin-id-1745344141099',
    'Admin User',
    'admin@almari.com',
    '$2b$10$8y9P0OkNkOSOnzVOo5cdUuJOT6k8zHfS/hUGnHbcCxgIRbEA2hvVG',
    'ADMIN',
    NOW(),
    NOW()
  );

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

-- Create vendor users and profiles
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'vendor-user-id-1',
      'Tech Store',
      'tech@example.com',
      '$2b$10$YalQUCvWrrZssUPYrbSg.uEqFXzNhXxnYT4cMzRHTyjM2JOWxsr9a',
      'VENDOR',
      NOW(),
      NOW()
    );
INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES (
      'vendor-id-1',
      'vendor-user-id-1',
      'Tech Haven',
      'Your one-stop shop for all tech gadgets',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      TRUE,
      10,
      'GTBank',
      '0123456789',
      NOW(),
      NOW()
    );
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'vendor-user-id-2',
      'Fashion Boutique',
      'fashion@example.com',
      '$2b$10$YalQUCvWrrZssUPYrbSg.uEqFXzNhXxnYT4cMzRHTyjM2JOWxsr9a',
      'VENDOR',
      NOW(),
      NOW()
    );
INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES (
      'vendor-id-2',
      'vendor-user-id-2',
      'Style Studio',
      'Trendy fashion for students',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      TRUE,
      12,
      'First Bank',
      '9876543210',
      NOW(),
      NOW()
    );
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'vendor-user-id-3',
      'Food Vendor',
      'food@example.com',
      '$2b$10$YalQUCvWrrZssUPYrbSg.uEqFXzNhXxnYT4cMzRHTyjM2JOWxsr9a',
      'VENDOR',
      NOW(),
      NOW()
    );
INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES (
      'vendor-id-3',
      'vendor-user-id-3',
      'Campus Eats',
      'Delicious food delivered to your hostel',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      TRUE,
      15,
      'Access Bank',
      '5678901234',
      NOW(),
      NOW()
    );

-- Create agent users and profiles
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'agent-user-id-1',
      'North Campus Agent',
      'northagent@example.com',
      '$2b$10$WGTp4b8eawBP9IMInxFdlO6z2xXmBrw7B.Z.6d6FRyTTH3FeJ7Tva',
      'AGENT',
      NOW(),
      NOW()
    );
INSERT INTO "Agent" (id, "userId", name, email, phone, location, "operatingHours", capacity, "isActive", "createdAt", "updatedAt") VALUES (
      'agent-id-1',
      'agent-user-id-1',
      'North Campus Pickup Point',
      'northagent@example.com',
      '08012345678',
      'North Campus Student Center',
      '9:00 AM - 5:00 PM',
      100,
      TRUE,
      NOW(),
      NOW()
    );
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'agent-user-id-2',
      'South Campus Agent',
      'southagent@example.com',
      '$2b$10$WGTp4b8eawBP9IMInxFdlO6z2xXmBrw7B.Z.6d6FRyTTH3FeJ7Tva',
      'AGENT',
      NOW(),
      NOW()
    );
INSERT INTO "Agent" (id, "userId", name, email, phone, location, "operatingHours", capacity, "isActive", "createdAt", "updatedAt") VALUES (
      'agent-id-2',
      'agent-user-id-2',
      'South Campus Pickup Point',
      'southagent@example.com',
      '08087654321',
      'South Campus Library Building',
      '10:00 AM - 6:00 PM',
      80,
      TRUE,
      NOW(),
      NOW()
    );

-- Create customer users and profiles
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'customer-user-id-1',
      'John Student',
      'john@student.edu',
      '$2b$10$Cz0XSKNc72xKVuaNmUztNuJqKiU.PLpyPQeDYev9YZcdZF0Le0gcK',
      'CUSTOMER',
      NOW(),
      NOW()
    );
INSERT INTO "Customer" (id, "userId", phone, address, hostel, room, college, "createdAt", "updatedAt") VALUES (
      'customer-id-1',
      'customer-user-id-1',
      '08123456789',
      'Block A',
      'Unity Hall',
      'A112',
      'Engineering',
      NOW(),
      NOW()
    );
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'customer-user-id-2',
      'Mary Student',
      'mary@student.edu',
      '$2b$10$Cz0XSKNc72xKVuaNmUztNuJqKiU.PLpyPQeDYev9YZcdZF0Le0gcK',
      'CUSTOMER',
      NOW(),
      NOW()
    );
INSERT INTO "Customer" (id, "userId", phone, address, hostel, room, college, "createdAt", "updatedAt") VALUES (
      'customer-id-2',
      'customer-user-id-2',
      '08234567890',
      'Block B',
      'Freedom Hall',
      'B205',
      'Science',
      NOW(),
      NOW()
    );
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      'customer-user-id-3',
      'Sam Student',
      'sam@student.edu',
      '$2b$10$Cz0XSKNc72xKVuaNmUztNuJqKiU.PLpyPQeDYev9YZcdZF0Le0gcK',
      'CUSTOMER',
      NOW(),
      NOW()
    );
INSERT INTO "Customer" (id, "userId", phone, address, hostel, room, college, "createdAt", "updatedAt") VALUES (
      'customer-id-3',
      'customer-user-id-3',
      '08345678901',
      'Block C',
      'Liberty Hall',
      'C310',
      'Arts',
      NOW(),
      NOW()
    );

-- Create carts for customers
INSERT INTO "Cart" (id, "customerId", "createdAt", "updatedAt") VALUES (
      'cart-id-1',
      'customer-id-1',
      NOW(),
      NOW()
    );
INSERT INTO "Cart" (id, "customerId", "createdAt", "updatedAt") VALUES (
      'cart-id-2',
      'customer-id-2',
      NOW(),
      NOW()
    );
INSERT INTO "Cart" (id, "customerId", "createdAt", "updatedAt") VALUES (
      'cart-id-3',
      'customer-id-3',
      NOW(),
      NOW()
    );

-- Create products
INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      'tech-product-id-1',
      'vendor-id-1',
      'Wireless Earbuds',
      'wireless-earbuds',
      'High-quality wireless earbuds with noise cancellation',
      15000,
      18000,
      'category-id-1',
      50,
      TRUE,
      NOW(),
      NOW()
    );
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      'tech-product-id-1-image-1',
      'tech-product-id-1',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'Wireless Earbuds',
      1,
      NOW(),
      NOW()
    );
INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      'tech-product-id-2',
      'vendor-id-1',
      'Power Bank',
      'power-bank',
      '20000mAh power bank for all your charging needs',
      8000,
      10000,
      'category-id-1',
      30,
      TRUE,
      NOW(),
      NOW()
    );
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      'tech-product-id-2-image-1',
      'tech-product-id-2',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'Power Bank',
      1,
      NOW(),
      NOW()
    );
INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      'fashion-product-id-1',
      'vendor-id-2',
      'Campus Hoodie',
      'campus-hoodie',
      'Comfortable hoodie with university logo',
      5000,
      6000,
      'category-id-2',
      100,
      TRUE,
      NOW(),
      NOW()
    );
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      'fashion-product-id-1-image-1',
      'fashion-product-id-1',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'Campus Hoodie',
      1,
      NOW(),
      NOW()
    );
INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      'fashion-product-id-2',
      'vendor-id-2',
      'Student Backpack',
      'student-backpack',
      'Durable backpack with laptop compartment',
      7500,
      9000,
      'category-id-2',
      75,
      TRUE,
      NOW(),
      NOW()
    );
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      'fashion-product-id-2-image-1',
      'fashion-product-id-2',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'Student Backpack',
      1,
      NOW(),
      NOW()
    );
INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      'food-product-id-1',
      'vendor-id-3',
      'Jollof Rice Pack',
      'jollof-rice-pack',
      'Delicious jollof rice with chicken',
      1500,
      'category-id-4',
      20,
      TRUE,
      NOW(),
      NOW()
    );
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      'food-product-id-1-image-1',
      'food-product-id-1',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'Jollof Rice Pack',
      1,
      NOW(),
      NOW()
    );
INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      'food-product-id-2',
      'vendor-id-3',
      'Snack Box',
      'snack-box',
      'Assortment of snacks for study sessions',
      2500,
      'category-id-4',
      15,
      TRUE,
      NOW(),
      NOW()
    );
INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      'food-product-id-2-image-1',
      'food-product-id-2',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'Snack Box',
      1,
      NOW(),
      NOW()
    );

-- Create reviews
INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES (
    'review-id-1',
    'customer-id-1',
    'tech-product-id-1',
    5,
    'Great earbuds, excellent sound quality!',
    NOW(),
    NOW()
  );
INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES (
    'review-id-2',
    'customer-id-2',
    'fashion-product-id-1',
    4,
    'Very comfortable and stylish.',
    NOW(),
    NOW()
  );
INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES (
    'review-id-3',
    'customer-id-3',
    'food-product-id-1',
    5,
    'Delicious jollof rice, will order again!',
    NOW(),
    NOW()
  );

-- Create orders
INSERT INTO "Order" (id, "customerId", "agentId", status, total, "paymentStatus", "paymentReference", "pickupCode", "pickupStatus", "pickupDate", "createdAt", "updatedAt") VALUES (
    'order-id-1',
    'customer-id-1',
    'agent-id-1',
    'DELIVERED',
    15000,
    'COMPLETED',
    'PAY-123456',
    '123456',
    'PICKED_UP',
    NOW() - INTERVAL '7 DAYS',
    NOW(),
    NOW()
  );
INSERT INTO "OrderItem" (id, "orderId", "productId", "vendorId", quantity, price, status, "createdAt", "updatedAt") VALUES (
    'order-item-id-1',
    'order-id-1',
    'tech-product-id-1',
    'vendor-id-1',
    1,
    15000,
    'DELIVERED',
    NOW(),
    NOW()
  );
INSERT INTO "Order" (id, "customerId", "agentId", status, total, "paymentStatus", "paymentReference", "pickupCode", "pickupStatus", "createdAt", "updatedAt") VALUES (
    'order-id-2',
    'customer-id-2',
    'agent-id-2',
    'PROCESSING',
    5000,
    'COMPLETED',
    'PAY-789012',
    '789012',
    'READY_FOR_PICKUP',
    NOW(),
    NOW()
  );
INSERT INTO "OrderItem" (id, "orderId", "productId", "vendorId", quantity, price, status, "createdAt", "updatedAt") VALUES (
    'order-item-id-2',
    'order-id-2',
    'fashion-product-id-1',
    'vendor-id-2',
    1,
    5000,
    'PROCESSING',
    NOW(),
    NOW()
  );
INSERT INTO "Order" (id, "customerId", "agentId", status, total, "paymentStatus", "pickupStatus", "createdAt", "updatedAt") VALUES (
    'order-id-3',
    'customer-id-3',
    'agent-id-1',
    'PENDING',
    1500,
    'PENDING',
    'PENDING',
    NOW(),
    NOW()
  );
INSERT INTO "OrderItem" (id, "orderId", "productId", "vendorId", quantity, price, status, "createdAt", "updatedAt") VALUES (
    'order-item-id-3',
    'order-id-3',
    'food-product-id-1',
    'vendor-id-3',
    1,
    1500,
    'PENDING',
    NOW(),
    NOW()
  );

-- Create return
INSERT INTO "Return" (id, "orderId", "productId", "customerId", "vendorId", "agentId", reason, status, "refundAmount", "refundStatus", "requestDate", "processDate", "createdAt", "updatedAt") VALUES (
    'return-id-1',
    'order-id-1',
    'tech-product-id-1',
    'customer-id-1',
    'vendor-id-1',
    'agent-id-1',
    'Item not as described',
    'APPROVED',
    15000,
    'PROCESSED',
    NOW() - INTERVAL '5 DAYS',
    NOW() - INTERVAL '3 DAYS',
    NOW(),
    NOW()
  );

-- Create notifications
INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "isRead", "createdAt") VALUES (
    'notification-id-1',
    'customer-user-id-1',
    'Order Delivered',
    'Your order has been delivered successfully',
    'ORDER_STATUS_CHANGE',
    'order-id-1',
    TRUE,
    NOW()
  );
INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "isRead", "createdAt") VALUES (
    'notification-id-2',
    'customer-user-id-2',
    'Order Ready for Pickup',
    'Your order is ready for pickup at South Campus Pickup Point',
    'PICKUP_READY',
    'order-id-2',
    FALSE,
    NOW()
  );
INSERT INTO "Notification" (id, "userId", title, message, type, "returnId", "isRead", "createdAt") VALUES (
    'notification-id-3',
    'customer-user-id-1',
    'Refund Processed',
    'Your refund has been processed successfully',
    'REFUND_PROCESSED',
    'return-id-1',
    FALSE,
    NOW()
  );
INSERT INTO "Notification" (id, "userId", title, message, type, "returnId", "isRead", "createdAt") VALUES (
    'notification-id-4',
    'vendor-user-id-1',
    'Return Request',
    'A customer has requested a return',
    'RETURN_REQUESTED',
    'return-id-1',
    TRUE,
    NOW()
  );
INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "isRead", "createdAt") VALUES (
    'notification-id-5',
    'agent-user-id-1',
    'New Order Assignment',
    'A new order has been assigned to your pickup point',
    'ORDER_STATUS_CHANGE',
    'order-id-3',
    FALSE,
    NOW()
  );