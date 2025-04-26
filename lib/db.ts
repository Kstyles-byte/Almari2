// This is a client-side safe database interface
// It delegates all database operations to server components and API routes

import { PrismaClient } from '@prisma/client';

// Create a proxy DB client that will be used in client components
// It mimics the shape of Prisma but throws errors if used on the client
const createSafeClient = () => {
  const handler = {
    get: (_target: unknown, prop: string) => {
      // Return a proxy for any model accessed
      if (typeof prop === 'string') {
        return new Proxy({}, {
          get: (_target: unknown, _operation: string) => {
            // When an operation is called (like findMany), return a function
            // that throws an error saying to use server components
            return () => {
              const error = new Error(
                `Database operations are not allowed in client components or on the client-side. ` +
                `Use a Server Component, Server Action, or API Route instead to access the database.`
              );
              throw error;
            };
          }
        });
      }
      return undefined;
    }
  };

  return new Proxy({}, handler) as unknown as PrismaClient;
};

// On the client, export a safe DB client
// On the server, we will directly import from lib/server/prisma
export const db = createSafeClient();