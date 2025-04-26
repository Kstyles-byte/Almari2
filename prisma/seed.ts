import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clean up existing data if needed
  await prisma.notification.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.agent.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.heroBanner.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@almari.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  
  console.log('Created admin user:', adminUser.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        icon: '📱',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fashion',
        slug: 'fashion',
        icon: '👕',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Books',
        slug: 'books',
        icon: '📚',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Food',
        slug: 'food',
        icon: '🍔',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Beauty',
        slug: 'beauty',
        icon: '💄',
      },
    }),
  ]);
  
  console.log('Created categories:', categories.map(c => c.name).join(', '));

  // Create vendors
  const vendorPassword = await bcrypt.hash('vendor123', 10);

  const vendorUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Tech Store',
        email: 'tech@example.com',
        password: vendorPassword,
        role: 'VENDOR',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Fashion Boutique',
        email: 'fashion@example.com',
        password: vendorPassword,
        role: 'VENDOR',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Food Vendor',
        email: 'food@example.com',
        password: vendorPassword,
        role: 'VENDOR',
      },
    }),
  ]);

  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        userId: vendorUsers[0].id,
        storeName: 'Tech Haven',
        description: 'Your one-stop shop for all tech gadgets',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        banner: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        isApproved: true,
        commissionRate: 10,
        bankName: 'GTBank',
        accountNumber: '0123456789',
      },
    }),
    prisma.vendor.create({
      data: {
        userId: vendorUsers[1].id,
        storeName: 'Style Studio',
        description: 'Trendy fashion for students',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        banner: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        isApproved: true,
        commissionRate: 12,
        bankName: 'First Bank',
        accountNumber: '9876543210',
      },
    }),
    prisma.vendor.create({
      data: {
        userId: vendorUsers[2].id,
        storeName: 'Campus Eats',
        description: 'Delicious food delivered to your hostel',
        logo: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        banner: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        isApproved: true,
        commissionRate: 15,
        bankName: 'Access Bank',
        accountNumber: '5678901234',
      },
    }),
  ]);
  
  console.log('Created vendors:', vendors.map(v => v.storeName).join(', '));

  // Create agents
  const agentPassword = await bcrypt.hash('agent123', 10);

  const agentUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'North Campus Agent',
        email: 'northagent@example.com',
        password: agentPassword,
        role: 'AGENT',
      },
    }),
    prisma.user.create({
      data: {
        name: 'South Campus Agent',
        email: 'southagent@example.com',
        password: agentPassword,
        role: 'AGENT',
      },
    }),
  ]);

  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        userId: agentUsers[0].id,
        name: 'North Campus Pickup Point',
        email: 'northagent@example.com',
        phone: '08012345678',
        location: 'North Campus Student Center',
        operatingHours: '9:00 AM - 5:00 PM',
        capacity: 100,
        isActive: true,
      },
    }),
    prisma.agent.create({
      data: {
        userId: agentUsers[1].id,
        name: 'South Campus Pickup Point',
        email: 'southagent@example.com',
        phone: '08087654321',
        location: 'South Campus Library Building',
        operatingHours: '10:00 AM - 6:00 PM',
        capacity: 80,
        isActive: true,
      },
    }),
  ]);
  
  console.log('Created agents:', agents.map(a => a.name).join(', '));

  // Create customers
  const customerPassword = await bcrypt.hash('customer123', 10);

  const customerUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Student',
        email: 'john@student.edu',
        password: customerPassword,
        role: 'CUSTOMER',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mary Student',
        email: 'mary@student.edu',
        password: customerPassword,
        role: 'CUSTOMER',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sam Student',
        email: 'sam@student.edu',
        password: customerPassword,
        role: 'CUSTOMER',
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        userId: customerUsers[0].id,
        phone: '08123456789',
        address: 'Block A',
        hostel: 'Unity Hall',
        room: 'A112',
        college: 'Engineering',
      },
    }),
    prisma.customer.create({
      data: {
        userId: customerUsers[1].id,
        phone: '08234567890',
        address: 'Block B',
        hostel: 'Freedom Hall',
        room: 'B205',
        college: 'Science',
      },
    }),
    prisma.customer.create({
      data: {
        userId: customerUsers[2].id,
        phone: '08345678901',
        address: 'Block C',
        hostel: 'Liberty Hall',
        room: 'C310',
        college: 'Arts',
      },
    }),
  ]);
  
  console.log('Created customers:', customers.map(c => c.userId).join(', '));

  // Create carts for customers
  const carts = await Promise.all([
    prisma.cart.create({
      data: {
        customerId: customers[0].id,
      },
    }),
    prisma.cart.create({
      data: {
        customerId: customers[1].id,
      },
    }),
    prisma.cart.create({
      data: {
        customerId: customers[2].id,
      },
    }),
  ]);
  
  console.log('Created carts for customers');

  // Create products
  const techProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: vendors[0].id,
        name: 'Wireless Earbuds',
        slug: 'wireless-earbuds',
        description: 'High-quality wireless earbuds with noise cancellation',
        price: 15000,
        comparePrice: 18000,
        categoryId: categories[0].id,
        inventory: 50,
        isPublished: true,
        images: {
          create: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              alt: 'Wireless Earbuds',
              order: 1,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        vendorId: vendors[0].id,
        name: 'Power Bank',
        slug: 'power-bank',
        description: '20000mAh power bank for all your charging needs',
        price: 8000,
        comparePrice: 10000,
        categoryId: categories[0].id,
        inventory: 30,
        isPublished: true,
        images: {
          create: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              alt: 'Power Bank',
              order: 1,
            },
          ],
        },
      },
    }),
  ]);

  const fashionProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: vendors[1].id,
        name: 'Campus Hoodie',
        slug: 'campus-hoodie',
        description: 'Comfortable hoodie with university logo',
        price: 5000,
        comparePrice: 6000,
        categoryId: categories[1].id,
        inventory: 100,
        isPublished: true,
        images: {
          create: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              alt: 'Campus Hoodie',
              order: 1,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        vendorId: vendors[1].id,
        name: 'Student Backpack',
        slug: 'student-backpack',
        description: 'Durable backpack with laptop compartment',
        price: 7500,
        comparePrice: 9000,
        categoryId: categories[1].id,
        inventory: 75,
        isPublished: true,
        images: {
          create: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              alt: 'Student Backpack',
              order: 1,
            },
          ],
        },
      },
    }),
  ]);

  const foodProducts = await Promise.all([
    prisma.product.create({
      data: {
        vendorId: vendors[2].id,
        name: 'Jollof Rice Pack',
        slug: 'jollof-rice-pack',
        description: 'Delicious jollof rice with chicken',
        price: 1500,
        categoryId: categories[3].id,
        inventory: 20,
        isPublished: true,
        images: {
          create: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              alt: 'Jollof Rice Pack',
              order: 1,
            },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        vendorId: vendors[2].id,
        name: 'Snack Box',
        slug: 'snack-box',
        description: 'Assortment of snacks for study sessions',
        price: 2500,
        categoryId: categories[3].id,
        inventory: 15,
        isPublished: true,
        images: {
          create: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              alt: 'Snack Box',
              order: 1,
            },
          ],
        },
      },
    }),
  ]);
  
  console.log('Created products for vendors');

  // Add some reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        customerId: customers[0].id,
        productId: techProducts[0].id,
        rating: 5,
        comment: 'Great earbuds, excellent sound quality!',
      },
    }),
    prisma.review.create({
      data: {
        customerId: customers[1].id,
        productId: fashionProducts[0].id,
        rating: 4,
        comment: 'Very comfortable and stylish.',
      },
    }),
    prisma.review.create({
      data: {
        customerId: customers[2].id,
        productId: foodProducts[0].id,
        rating: 5,
        comment: 'Delicious jollof rice, will order again!',
      },
    }),
  ]);
  
  console.log('Created reviews for products');

  // Create sample orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        customerId: customers[0].id,
        agentId: agents[0].id,
        status: 'DELIVERED',
        total: 15000,
        paymentStatus: 'COMPLETED',
        paymentReference: 'PAY-123456',
        pickupCode: '123456',
        pickupStatus: 'PICKED_UP',
        pickupDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        items: {
          create: [
            {
              productId: techProducts[0].id,
              vendorId: vendors[0].id,
              quantity: 1,
              price: 15000,
              status: 'DELIVERED',
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        customerId: customers[1].id,
        agentId: agents[1].id,
        status: 'PROCESSING',
        total: 5000,
        paymentStatus: 'COMPLETED',
        paymentReference: 'PAY-789012',
        pickupCode: '789012',
        pickupStatus: 'READY_FOR_PICKUP',
        items: {
          create: [
            {
              productId: fashionProducts[0].id,
              vendorId: vendors[1].id,
              quantity: 1,
              price: 5000,
              status: 'PROCESSING',
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        customerId: customers[2].id,
        agentId: agents[0].id,
        status: 'PENDING',
        total: 1500,
        paymentStatus: 'PENDING',
        pickupStatus: 'PENDING',
        items: {
          create: [
            {
              productId: foodProducts[0].id,
              vendorId: vendors[2].id,
              quantity: 1,
              price: 1500,
              status: 'PENDING',
            },
          ],
        },
      },
    }),
  ]);
  
  console.log('Created sample orders');

  // Create a sample return
  const sampleReturn = await prisma.return.create({
    data: {
      orderId: orders[0].id,
      productId: techProducts[0].id,
      customerId: customers[0].id,
      vendorId: vendors[0].id,
      agentId: agents[0].id,
      reason: 'Item not as described',
      status: 'APPROVED',
      refundAmount: 15000,
      refundStatus: 'PROCESSED',
      requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      processDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });
  
  console.log('Created sample return');

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: customerUsers[0].id,
        title: 'Order Delivered',
        message: 'Your order has been delivered successfully',
        type: 'ORDER_STATUS_CHANGE',
        orderId: orders[0].id,
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: customerUsers[1].id,
        title: 'Order Ready for Pickup',
        message: 'Your order is ready for pickup at South Campus Pickup Point',
        type: 'PICKUP_READY',
        orderId: orders[1].id,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: customerUsers[0].id,
        title: 'Refund Processed',
        message: 'Your refund has been processed successfully',
        type: 'REFUND_PROCESSED',
        returnId: sampleReturn.id,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: vendorUsers[0].id,
        title: 'Return Request',
        message: 'A customer has requested a return',
        type: 'RETURN_REQUESTED',
        returnId: sampleReturn.id,
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: agentUsers[0].id,
        title: 'New Order Assignment',
        message: 'A new order has been assigned to your pickup point',
        type: 'ORDER_STATUS_CHANGE',
        orderId: orders[2].id,
        isRead: false,
      },
    }),
  ]);
  
  console.log('Created sample notifications');

  // Create more products for other vendors and categories...
  
  console.log('Created products for all vendors');

  // Create hero banners
  const heroBanners = await Promise.all([
    prisma.heroBanner.create({
      data: {
        title: "Summer Collection",
        subtitle: "Discover our new arrivals for the summer season with amazing discounts",
        buttonText: "Shop Now",
        buttonLink: "/products?category=fashion",
        imageUrl: "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        mobileImageUrl: "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        isActive: true,
        priority: 10
      }
    }),
    prisma.heroBanner.create({
      data: {
        title: "Tech Gadgets Sale",
        subtitle: "Latest electronics with free agent delivery for a limited time",
        buttonText: "Explore Deals",
        buttonLink: "/products?category=electronics",
        imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        mobileImageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        isActive: true,
        priority: 5,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Start in 7 days
      }
    }),
    prisma.heroBanner.create({
      data: {
        title: "Back to School",
        subtitle: "Everything you need for the new semester right on campus",
        buttonText: "Get Prepared",
        buttonLink: "/products?category=books",
        imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2022&q=80",
        isActive: true,
        priority: 3
      }
    })
  ]);

  console.log('Created hero banners:', heroBanners.length);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 