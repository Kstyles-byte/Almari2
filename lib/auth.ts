import { auth } from "../auth";

// Define UserRole enum to match Prisma schema
enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR"
}

export const currentUser = async () => {
  const session = await auth();
  return session?.user;
};

export const currentRole = async () => {
  const session = await auth();
  return session?.user?.role;
};

export const isAdmin = async () => {
  const role = await currentRole();
  return role === UserRole.ADMIN;
};

export const isVendor = async () => {
  const role = await currentRole();
  return role === UserRole.VENDOR;
};

export const isCustomer = async () => {
  const role = await currentRole();
  return role === UserRole.CUSTOMER;
}; 