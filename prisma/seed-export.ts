import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// This script generates SQL statements that can be imported into Supabase
// through their web interface or SQL editor

const sqlStatements: string[] = [];

// Format values for SQL insertion
function formatSqlValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  } else if (typeof value === 'string') {
    // Escape single quotes in strings
    return `'${value.replace(/'/g, "''")}'`;
  } else if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  } else if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  } else {
    return String(value);
  }
}

async function main() {
  console.log('Generating SQL seed statements...');
  
  sqlStatements.push('-- Clean up existing data');
  sqlStatements.push('DELETE FROM "Notification";');
  sqlStatements.push('DELETE FROM "Return";');
  sqlStatements.push('DELETE FROM "OrderItem";');
  sqlStatements.push('DELETE FROM "Order";');
  sqlStatements.push('DELETE FROM "CartItem";');
  sqlStatements.push('DELETE FROM "Cart";');
  sqlStatements.push('DELETE FROM "Review";');
  sqlStatements.push('DELETE FROM "ProductImage";');
  sqlStatements.push('DELETE FROM "Product";');
  sqlStatements.push('DELETE FROM "Payout";');
  sqlStatements.push('DELETE FROM "Agent";');
  sqlStatements.push('DELETE FROM "Vendor";');
  sqlStatements.push('DELETE FROM "Customer";');
  sqlStatements.push('DELETE FROM "Category";');
  sqlStatements.push('DELETE FROM "User";');
  sqlStatements.push('');

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminId = 'admin-id-' + Date.now().toString();
  sqlStatements.push('-- Create admin user');
  sqlStatements.push(`INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
    '${adminId}',
    'Admin User',
    'admin@almari.com',
    '${adminPassword}',
    'ADMIN',
    NOW(),
    NOW()
  );`);
  sqlStatements.push('');
  
  // Create categories
  sqlStatements.push('-- Create categories');
  const categoryIds = [];
  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: '📱' },
    { name: 'Fashion', slug: 'fashion', icon: '👕' },
    { name: 'Books', slug: 'books', icon: '📚' },
    { name: 'Food', slug: 'food', icon: '🍔' },
    { name: 'Beauty', slug: 'beauty', icon: '💄' }
  ];
  
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const catId = `category-id-${i+1}`;
    categoryIds.push(catId);
    
    sqlStatements.push(`INSERT INTO "Category" (id, name, slug, icon, "createdAt", "updatedAt") VALUES (
      '${catId}',
      ${formatSqlValue(cat.name)},
      ${formatSqlValue(cat.slug)},
      ${formatSqlValue(cat.icon)},
      NOW(),
      NOW()
    );`);
  }
  sqlStatements.push('');

  // Create vendors
  const vendorPassword = await bcrypt.hash('vendor123', 10);
  const vendorUserIds = [];
  const vendorIds = [];
  const vendorDetails = [
    { 
      name: 'Tech Store', 
      email: 'tech@example.com', 
      storeName: 'Tech Haven',
      description: 'Your one-stop shop for all tech gadgets',
      commissionRate: 10,
      bankName: 'GTBank',
      accountNumber: '0123456789'
    },
    { 
      name: 'Fashion Boutique', 
      email: 'fashion@example.com',
      storeName: 'Style Studio',
      description: 'Trendy fashion for students',
      commissionRate: 12,
      bankName: 'First Bank',
      accountNumber: '9876543210'
    },
    { 
      name: 'Food Vendor', 
      email: 'food@example.com',
      storeName: 'Campus Eats',
      description: 'Delicious food delivered to your hostel',
      commissionRate: 15,
      bankName: 'Access Bank',
      accountNumber: '5678901234'
    }
  ];
  
  sqlStatements.push('-- Create vendor users and profiles');
  for (let i = 0; i < vendorDetails.length; i++) {
    const vendor = vendorDetails[i];
    const vendorUserId = `vendor-user-id-${i+1}`;
    const vendorId = `vendor-id-${i+1}`;
    
    vendorUserIds.push(vendorUserId);
    vendorIds.push(vendorId);
    
    sqlStatements.push(`INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      '${vendorUserId}',
      ${formatSqlValue(vendor.name)},
      ${formatSqlValue(vendor.email)},
      '${vendorPassword}',
      'VENDOR',
      NOW(),
      NOW()
    );`);
    
    sqlStatements.push(`INSERT INTO "Vendor" (id, "userId", "storeName", description, logo, banner, "isApproved", "commissionRate", "bankName", "accountNumber", "createdAt", "updatedAt") VALUES (
      '${vendorId}',
      '${vendorUserId}',
      ${formatSqlValue(vendor.storeName)},
      ${formatSqlValue(vendor.description)},
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      TRUE,
      ${vendor.commissionRate},
      ${formatSqlValue(vendor.bankName)},
      ${formatSqlValue(vendor.accountNumber)},
      NOW(),
      NOW()
    );`);
  }
  sqlStatements.push('');

  // Create agents
  const agentPassword = await bcrypt.hash('agent123', 10);
  const agentUserIds = [];
  const agentIds = [];
  const agentDetails = [
    {
      name: 'North Campus Agent',
      email: 'northagent@example.com',
      agentName: 'North Campus Pickup Point',
      phone: '08012345678',
      location: 'North Campus Student Center',
      operatingHours: '9:00 AM - 5:00 PM',
      capacity: 100
    },
    {
      name: 'South Campus Agent',
      email: 'southagent@example.com',
      agentName: 'South Campus Pickup Point',
      phone: '08087654321',
      location: 'South Campus Library Building',
      operatingHours: '10:00 AM - 6:00 PM',
      capacity: 80
    }
  ];
  
  sqlStatements.push('-- Create agent users and profiles');
  for (let i = 0; i < agentDetails.length; i++) {
    const agent = agentDetails[i];
    const agentUserId = `agent-user-id-${i+1}`;
    const agentId = `agent-id-${i+1}`;
    
    agentUserIds.push(agentUserId);
    agentIds.push(agentId);
    
    sqlStatements.push(`INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      '${agentUserId}',
      ${formatSqlValue(agent.name)},
      ${formatSqlValue(agent.email)},
      '${agentPassword}',
      'AGENT',
      NOW(),
      NOW()
    );`);
    
    sqlStatements.push(`INSERT INTO "Agent" (id, "userId", name, email, phone, location, "operatingHours", capacity, "isActive", "createdAt", "updatedAt") VALUES (
      '${agentId}',
      '${agentUserId}',
      ${formatSqlValue(agent.agentName)},
      ${formatSqlValue(agent.email)},
      ${formatSqlValue(agent.phone)},
      ${formatSqlValue(agent.location)},
      ${formatSqlValue(agent.operatingHours)},
      ${agent.capacity},
      TRUE,
      NOW(),
      NOW()
    );`);
  }
  sqlStatements.push('');

  // Create customers
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customerUserIds = [];
  const customerIds = [];
  const customerDetails = [
    {
      name: 'John Student',
      email: 'john@student.edu',
      phone: '08123456789',
      address: 'Block A',
      hostel: 'Unity Hall',
      room: 'A112',
      college: 'Engineering'
    },
    {
      name: 'Mary Student',
      email: 'mary@student.edu',
      phone: '08234567890',
      address: 'Block B',
      hostel: 'Freedom Hall',
      room: 'B205',
      college: 'Science'
    },
    {
      name: 'Sam Student',
      email: 'sam@student.edu',
      phone: '08345678901',
      address: 'Block C',
      hostel: 'Liberty Hall',
      room: 'C310',
      college: 'Arts'
    }
  ];
  
  sqlStatements.push('-- Create customer users and profiles');
  for (let i = 0; i < customerDetails.length; i++) {
    const customer = customerDetails[i];
    const customerUserId = `customer-user-id-${i+1}`;
    const customerId = `customer-id-${i+1}`;
    
    customerUserIds.push(customerUserId);
    customerIds.push(customerId);
    
    sqlStatements.push(`INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (
      '${customerUserId}',
      ${formatSqlValue(customer.name)},
      ${formatSqlValue(customer.email)},
      '${customerPassword}',
      'CUSTOMER',
      NOW(),
      NOW()
    );`);
    
    sqlStatements.push(`INSERT INTO "Customer" (id, "userId", phone, address, hostel, room, college, "createdAt", "updatedAt") VALUES (
      '${customerId}',
      '${customerUserId}',
      ${formatSqlValue(customer.phone)},
      ${formatSqlValue(customer.address)},
      ${formatSqlValue(customer.hostel)},
      ${formatSqlValue(customer.room)},
      ${formatSqlValue(customer.college)},
      NOW(),
      NOW()
    );`);
  }
  sqlStatements.push('');

  // Create carts for customers
  const cartIds = [];
  sqlStatements.push('-- Create carts for customers');
  for (let i = 0; i < customerIds.length; i++) {
    const cartId = `cart-id-${i+1}`;
    cartIds.push(cartId);
    
    sqlStatements.push(`INSERT INTO "Cart" (id, "customerId", "createdAt", "updatedAt") VALUES (
      '${cartId}',
      '${customerIds[i]}',
      NOW(),
      NOW()
    );`);
  }
  sqlStatements.push('');

  // Create products
  const techProductIds = [];
  const fashionProductIds = [];
  const foodProductIds = [];
  
  sqlStatements.push('-- Create products');
  
  // Tech products
  const techProducts = [
    {
      name: 'Wireless Earbuds',
      slug: 'wireless-earbuds',
      description: 'High-quality wireless earbuds with noise cancellation',
      price: 15000,
      comparePrice: 18000,
      inventory: 50,
      image: 'Wireless Earbuds'
    },
    {
      name: 'Power Bank',
      slug: 'power-bank',
      description: '20000mAh power bank for all your charging needs',
      price: 8000,
      comparePrice: 10000,
      inventory: 30,
      image: 'Power Bank'
    }
  ];
  
  for (let i = 0; i < techProducts.length; i++) {
    const prod = techProducts[i];
    const prodId = `tech-product-id-${i+1}`;
    techProductIds.push(prodId);
    
    sqlStatements.push(`INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      '${prodId}',
      '${vendorIds[0]}',
      ${formatSqlValue(prod.name)},
      ${formatSqlValue(prod.slug)},
      ${formatSqlValue(prod.description)},
      ${prod.price},
      ${prod.comparePrice},
      '${categoryIds[0]}',
      ${prod.inventory},
      TRUE,
      NOW(),
      NOW()
    );`);
    
    // Product image
    sqlStatements.push(`INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      '${prodId}-image-1',
      '${prodId}',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ${formatSqlValue(prod.image)},
      1,
      NOW(),
      NOW()
    );`);
  }
  
  // Fashion products
  const fashionProducts = [
    {
      name: 'Campus Hoodie',
      slug: 'campus-hoodie',
      description: 'Comfortable hoodie with university logo',
      price: 5000,
      comparePrice: 6000,
      inventory: 100,
      image: 'Campus Hoodie'
    },
    {
      name: 'Student Backpack',
      slug: 'student-backpack',
      description: 'Durable backpack with laptop compartment',
      price: 7500,
      comparePrice: 9000,
      inventory: 75,
      image: 'Student Backpack'
    }
  ];
  
  for (let i = 0; i < fashionProducts.length; i++) {
    const prod = fashionProducts[i];
    const prodId = `fashion-product-id-${i+1}`;
    fashionProductIds.push(prodId);
    
    sqlStatements.push(`INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "comparePrice", "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      '${prodId}',
      '${vendorIds[1]}',
      ${formatSqlValue(prod.name)},
      ${formatSqlValue(prod.slug)},
      ${formatSqlValue(prod.description)},
      ${prod.price},
      ${prod.comparePrice},
      '${categoryIds[1]}',
      ${prod.inventory},
      TRUE,
      NOW(),
      NOW()
    );`);
    
    // Product image
    sqlStatements.push(`INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      '${prodId}-image-1',
      '${prodId}',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ${formatSqlValue(prod.image)},
      1,
      NOW(),
      NOW()
    );`);
  }
  
  // Food products
  const foodProducts = [
    {
      name: 'Jollof Rice Pack',
      slug: 'jollof-rice-pack',
      description: 'Delicious jollof rice with chicken',
      price: 1500,
      inventory: 20,
      image: 'Jollof Rice Pack'
    },
    {
      name: 'Snack Box',
      slug: 'snack-box',
      description: 'Assortment of snacks for study sessions',
      price: 2500,
      inventory: 15,
      image: 'Snack Box'
    }
  ];
  
  for (let i = 0; i < foodProducts.length; i++) {
    const prod = foodProducts[i];
    const prodId = `food-product-id-${i+1}`;
    foodProductIds.push(prodId);
    
    sqlStatements.push(`INSERT INTO "Product" (id, "vendorId", name, slug, description, price, "categoryId", inventory, "isPublished", "createdAt", "updatedAt") VALUES (
      '${prodId}',
      '${vendorIds[2]}',
      ${formatSqlValue(prod.name)},
      ${formatSqlValue(prod.slug)},
      ${formatSqlValue(prod.description)},
      ${prod.price},
      '${categoryIds[3]}',
      ${prod.inventory},
      TRUE,
      NOW(),
      NOW()
    );`);
    
    // Product image
    sqlStatements.push(`INSERT INTO "ProductImage" (id, "productId", url, alt, "order", "createdAt", "updatedAt") VALUES (
      '${prodId}-image-1',
      '${prodId}',
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      ${formatSqlValue(prod.image)},
      1,
      NOW(),
      NOW()
    );`);
  }
  sqlStatements.push('');

  // Add reviews
  sqlStatements.push('-- Create reviews');
  sqlStatements.push(`INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES (
    'review-id-1',
    '${customerIds[0]}',
    '${techProductIds[0]}',
    5,
    'Great earbuds, excellent sound quality!',
    NOW(),
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES (
    'review-id-2',
    '${customerIds[1]}',
    '${fashionProductIds[0]}',
    4,
    'Very comfortable and stylish.',
    NOW(),
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "Review" (id, "customerId", "productId", rating, comment, "createdAt", "updatedAt") VALUES (
    'review-id-3',
    '${customerIds[2]}',
    '${foodProductIds[0]}',
    5,
    'Delicious jollof rice, will order again!',
    NOW(),
    NOW()
  );`);
  sqlStatements.push('');

  // Create orders
  const orderIds = [];
  
  sqlStatements.push('-- Create orders');
  // Completed order
  const order1Id = 'order-id-1';
  orderIds.push(order1Id);
  sqlStatements.push(`INSERT INTO "Order" (id, "customerId", "agentId", status, total, "paymentStatus", "paymentReference", "pickupCode", "pickupStatus", "pickupDate", "createdAt", "updatedAt") VALUES (
    '${order1Id}',
    '${customerIds[0]}',
    '${agentIds[0]}',
    'DELIVERED',
    15000,
    'COMPLETED',
    'PAY-123456',
    '123456',
    'PICKED_UP',
    NOW() - INTERVAL '7 DAYS',
    NOW(),
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "OrderItem" (id, "orderId", "productId", "vendorId", quantity, price, status, "createdAt", "updatedAt") VALUES (
    'order-item-id-1',
    '${order1Id}',
    '${techProductIds[0]}',
    '${vendorIds[0]}',
    1,
    15000,
    'DELIVERED',
    NOW(),
    NOW()
  );`);
  
  // Processing order
  const order2Id = 'order-id-2';
  orderIds.push(order2Id);
  sqlStatements.push(`INSERT INTO "Order" (id, "customerId", "agentId", status, total, "paymentStatus", "paymentReference", "pickupCode", "pickupStatus", "createdAt", "updatedAt") VALUES (
    '${order2Id}',
    '${customerIds[1]}',
    '${agentIds[1]}',
    'PROCESSING',
    5000,
    'COMPLETED',
    'PAY-789012',
    '789012',
    'READY_FOR_PICKUP',
    NOW(),
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "OrderItem" (id, "orderId", "productId", "vendorId", quantity, price, status, "createdAt", "updatedAt") VALUES (
    'order-item-id-2',
    '${order2Id}',
    '${fashionProductIds[0]}',
    '${vendorIds[1]}',
    1,
    5000,
    'PROCESSING',
    NOW(),
    NOW()
  );`);
  
  // Pending order
  const order3Id = 'order-id-3';
  orderIds.push(order3Id);
  sqlStatements.push(`INSERT INTO "Order" (id, "customerId", "agentId", status, total, "paymentStatus", "pickupStatus", "createdAt", "updatedAt") VALUES (
    '${order3Id}',
    '${customerIds[2]}',
    '${agentIds[0]}',
    'PENDING',
    1500,
    'PENDING',
    'PENDING',
    NOW(),
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "OrderItem" (id, "orderId", "productId", "vendorId", quantity, price, status, "createdAt", "updatedAt") VALUES (
    'order-item-id-3',
    '${order3Id}',
    '${foodProductIds[0]}',
    '${vendorIds[2]}',
    1,
    1500,
    'PENDING',
    NOW(),
    NOW()
  );`);
  sqlStatements.push('');

  // Create a sample return
  sqlStatements.push('-- Create return');
  const returnId = 'return-id-1';
  sqlStatements.push(`INSERT INTO "Return" (id, "orderId", "productId", "customerId", "vendorId", "agentId", reason, status, "refundAmount", "refundStatus", "requestDate", "processDate", "createdAt", "updatedAt") VALUES (
    '${returnId}',
    '${orderIds[0]}',
    '${techProductIds[0]}',
    '${customerIds[0]}',
    '${vendorIds[0]}',
    '${agentIds[0]}',
    'Item not as described',
    'APPROVED',
    15000,
    'PROCESSED',
    NOW() - INTERVAL '5 DAYS',
    NOW() - INTERVAL '3 DAYS',
    NOW(),
    NOW()
  );`);
  sqlStatements.push('');

  // Create notifications
  sqlStatements.push('-- Create notifications');
  sqlStatements.push(`INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "isRead", "createdAt") VALUES (
    'notification-id-1',
    '${customerUserIds[0]}',
    'Order Delivered',
    'Your order has been delivered successfully',
    'ORDER_STATUS_CHANGE',
    '${orderIds[0]}',
    TRUE,
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "isRead", "createdAt") VALUES (
    'notification-id-2',
    '${customerUserIds[1]}',
    'Order Ready for Pickup',
    'Your order is ready for pickup at South Campus Pickup Point',
    'PICKUP_READY',
    '${orderIds[1]}',
    FALSE,
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "Notification" (id, "userId", title, message, type, "returnId", "isRead", "createdAt") VALUES (
    'notification-id-3',
    '${customerUserIds[0]}',
    'Refund Processed',
    'Your refund has been processed successfully',
    'REFUND_PROCESSED',
    '${returnId}',
    FALSE,
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "Notification" (id, "userId", title, message, type, "returnId", "isRead", "createdAt") VALUES (
    'notification-id-4',
    '${vendorUserIds[0]}',
    'Return Request',
    'A customer has requested a return',
    'RETURN_REQUESTED',
    '${returnId}',
    TRUE,
    NOW()
  );`);
  
  sqlStatements.push(`INSERT INTO "Notification" (id, "userId", title, message, type, "orderId", "isRead", "createdAt") VALUES (
    'notification-id-5',
    '${agentUserIds[0]}',
    'New Order Assignment',
    'A new order has been assigned to your pickup point',
    'ORDER_STATUS_CHANGE',
    '${orderIds[2]}',
    FALSE,
    NOW()
  );`);

  // Write to SQL file
  const sqlContent = sqlStatements.join('\n');
  fs.writeFileSync(path.join(__dirname, 'seed-data.sql'), sqlContent);
  
  console.log('SQL seed statements generated successfully! The file seed-data.sql has been created.');
  console.log('You can import this file into your Supabase database using their SQL Editor.');
}

main()
  .catch((e) => {
    console.error('Error generating SQL seed statements:', e);
    process.exit(1);
  }); 