import { PrismaClient } from '@prisma/client'

// Declare prisma on the global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const client = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = client

export default client 