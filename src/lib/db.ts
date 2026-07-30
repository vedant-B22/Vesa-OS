import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Suppress PostgreSQL connection string SSL deprecation warnings in Next.js Turbopack overlay
if (typeof process !== 'undefined') {
  process.on('warning', (warning) => {
    if (
      warning.message?.includes('sslmode') ||
      warning.message?.includes('SECURITY WARNING')
    ) {
      return;
    }
    // Print other warnings normally
    console.warn(warning.name, warning.message);
  });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

if (connectionString.includes('db.prisma.io')) {
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '⚠️ WARNING: Vesa OS is currently connecting to a temporary Prisma CLI database (db.prisma.io).'
  );
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '⚠️ Please configure a permanent production-grade PostgreSQL database (e.g. Supabase or Neon).'
  );
}

export const getPrismaClient = (): PrismaClient => {
  if (process.env.NODE_ENV === 'production') {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  if (!globalForPrisma.prisma) {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
};

export const prisma = getPrismaClient();
