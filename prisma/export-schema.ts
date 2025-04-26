import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Generating database schema SQL...');
  
  // Read the Prisma schema file
  const schemaPath = path.join(__dirname, 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Create SQL for enums
  const sqlStatements = [];
  
  // User roles
  sqlStatements.push(`-- Create enum types`);
  sqlStatements.push(`CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CUSTOMER', 'VENDOR', 'AGENT');`);
  sqlStatements.push(`CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');`);
  sqlStatements.push(`CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');`);
  sqlStatements.push(`CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');`);
  sqlStatements.push(`CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');`);
  sqlStatements.push(`CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'READY_FOR_PICKUP', 'PICKED_UP');`);
  sqlStatements.push(`CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');`);
  sqlStatements.push(`CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');`);
  sqlStatements.push(`CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS_CHANGE', 'PICKUP_READY', 'ORDER_PICKED_UP', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'REFUND_PROCESSED');`);
  sqlStatements.push(``);
  
  // Create tables
  sqlStatements.push(`-- Create User table`);
  sqlStatements.push(`CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Customer table`);
  sqlStatements.push(`CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "hostel" TEXT,
    "room" TEXT,
    "college" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(`CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Vendor table`);
  sqlStatements.push(`CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(`CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Category table`);
  sqlStatements.push(`CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(`CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Product table`);
  sqlStatements.push(`CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "comparePrice" DECIMAL(65,30),
    "categoryId" TEXT NOT NULL,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(`CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create ProductImage table`);
  sqlStatements.push(`CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Agent table`);
  sqlStatements.push(`CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "operatingHours" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(`CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");`);
  sqlStatements.push(`CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Order table`);
  sqlStatements.push(`CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL(65,30) NOT NULL,
    "shippingAddress" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT,
    "pickupCode" TEXT,
    "pickupStatus" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "pickupDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create OrderItem table`);
  sqlStatements.push(`CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Review table`);
  sqlStatements.push(`CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Cart table`);
  sqlStatements.push(`CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(`CREATE UNIQUE INDEX "Cart_customerId_key" ON "Cart"("customerId");`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create CartItem table`);
  sqlStatements.push(`CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Payout table`);
  sqlStatements.push(`CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Return table`);
  sqlStatements.push(`CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "refundAmount" DECIMAL(65,30) NOT NULL,
    "refundStatus" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  sqlStatements.push(`-- Create Notification table`);
  sqlStatements.push(`CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "orderId" TEXT,
    "returnId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
  );`);
  sqlStatements.push(``);
  
  // Add foreign key constraints
  sqlStatements.push(`-- Add foreign key constraints`);
  sqlStatements.push(`ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Order" ADD CONSTRAINT "Order_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Payout" ADD CONSTRAINT "Payout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Return" ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Return" ADD CONSTRAINT "Return_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Return" ADD CONSTRAINT "Return_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Return" ADD CONSTRAINT "Return_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Return" ADD CONSTRAINT "Return_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
  sqlStatements.push(`ALTER TABLE "Notification" ADD CONSTRAINT "Notification_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);

  // Write to SQL file
  const sqlContent = sqlStatements.join('\n');
  fs.writeFileSync(path.join(__dirname, 'schema.sql'), sqlContent);
  
  console.log('SQL schema generated successfully! The file schema.sql has been created.');
  console.log('You should run this file in Supabase SQL Editor first, before running the seed data script.');
}

main()
  .catch((e) => {
    console.error('Error generating SQL schema:', e);
    process.exit(1);
  }); 