// Suppress pg library SSL mode alias warning
if (typeof process !== 'undefined') {
  process.on('warning', (warning) => {
    if (warning.message?.includes('sslmode') || warning.message?.includes('SECURITY WARNING')) {
      return;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const crypto = require('crypto');
require('dotenv/config');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function seed() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('Missing DATABASE_URL in .env file.');
  }

  console.log('Initializing Prisma Client...');
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Creating/finding Demo Client Organization...');
  const clientOrg = await prisma.client.upsert({
    where: { id: 'demo-client-org-id' },
    update: { name: 'Demo Client Org' },
    create: { id: 'demo-client-org-id', name: 'Demo Client Org' }
  });

  const email = 'client@demo.com';
  const password = 'Demo123@';
  const name = 'Demo Client';
  const passwordHash = hashPassword(password);
  const userId = 'local-client-demo';

  console.log(`Upserting user ${email} in Database...`);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'CLIENT',
      clientId: clientOrg.id,
      passwordHash
    },
    create: {
      id: userId,
      email,
      name,
      role: 'CLIENT',
      clientId: clientOrg.id,
      passwordHash
    }
  });

  console.log('Client account seeded successfully!');
  console.log('------------------------------------');
  console.log('Login Details:');
  console.log('Portal: Client Portal');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Role:', user.role);
  console.log('Client Org:', clientOrg.name);
  console.log('------------------------------------');

  await prisma.$disconnect();
  await pool.end();
}

seed().catch(err => {
  console.error('Client seeding failed:', err);
});
