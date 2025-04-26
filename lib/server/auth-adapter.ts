import prisma from './prisma';
import type { Adapter } from 'next-auth/adapters';

export function CustomPrismaAdapter(): Adapter {
  return {
    async createUser(user) {
      return await prisma.user.create({
        data: {
          name: user.name || '',
          email: user.email,
          role: 'CUSTOMER',
        },
      });
    },
    async getUser(id) {
      return await prisma.user.findUnique({ where: { id } }) || null;
    },
    async getUserByEmail(email) {
      return await prisma.user.findUnique({ where: { email } }) || null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });
      return account?.user || null;
    },
    async updateUser(user) {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
        },
      });
    },
    async linkAccount(account) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
      return account;
    },
    async createSession({ sessionToken, userId, expires }) {
      await prisma.session.create({
        data: {
          sessionToken,
          userId,
          expires,
        },
      });
      return {
        sessionToken,
        userId,
        expires,
      };
    },
    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!session) return null;
      return {
        session: {
          userId: session.userId,
          sessionToken: session.sessionToken,
          expires: session.expires,
        },
        user: session.user,
      };
    },
    async updateSession({ sessionToken, expires, userId }) {
      const data: any = {};
      if (expires) data.expires = expires;
      if (userId) data.userId = userId;

      return await prisma.session.update({
        where: { sessionToken },
        data,
      });
    },
    async deleteSession(sessionToken) {
      await prisma.session.delete({
        where: { sessionToken },
      });
    },
    // Implement verification token methods if needed
    async createVerificationToken({ identifier, expires, token }) {
      const verificationToken = await prisma.verificationToken.create({
        data: { identifier, expires, token },
      });
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return verificationToken;
      } catch {
        return null;
      }
    },
  };
} 