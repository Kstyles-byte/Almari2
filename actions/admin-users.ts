'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'VENDOR', 'CUSTOMER', 'AGENT']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'VENDOR', 'CUSTOMER', 'AGENT']).optional(),
  isActive: z.boolean().optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Check if the current user has admin permissions
 */
async function checkAdminPermission() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return session.user;
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = createUserSchema.parse(data);
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        // In a real implementation, you would hash the password
        // and handle proper password management
        // For now, this is just a placeholder
        // password: await bcrypt.hash(validatedData.password, 10),
      },
    });
    
    // Revalidate admin users page
    revalidatePath('/admin/users');
    
    return { success: true, user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(data: UpdateUserInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = updateUserSchema.parse(data);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.id },
    });
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // If email is being updated, check if new email is already in use
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      
      if (emailExists) {
        throw new Error('A user with this email already exists');
      }
    }
    
    // Update user
    const user = await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        // Handle active status if provided
        // You might want to expand this based on your User schema
      },
    });
    
    // Revalidate admin users page
    revalidatePath('/admin/users');
    
    return { success: true, user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  await checkAdminPermission();
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });
    
    // Revalidate admin users page
    revalidatePath('/admin/users');
    
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
}

/**
 * Get users with filtering and pagination
 */
export async function getUsers({
  page = 1,
  limit = 10,
  search = '',
  role = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  await checkAdminPermission();
  
  try {
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    // Count total users for pagination
    const totalUsers = await prisma.user.count({ where });
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    
    return {
      success: true,
      users,
      pagination: {
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unknown error occurred' };
  }
} 