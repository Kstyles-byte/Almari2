import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Define UserRole enum to match Prisma schema
enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR",
  AGENT = "AGENT"
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    id: string;
  }
} 