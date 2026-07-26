// Suppress pg library SSL mode alias warning
if (typeof process !== 'undefined') {
  process.on('warning', (warning) => {
    if (warning.message?.includes('sslmode') || warning.message?.includes('SECURITY WARNING')) {
      return;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv/config');

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !serviceKey || !dbUrl) {
    throw new Error('Missing environment credentials in .env file.');
  }

  console.log('Initializing Prisma Client...');
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const adminEmail = 'admin@vesastudios.com';
  const adminPassword = 'adminpassword123';
  const adminName = 'Vesa Admin';
  let userId = '88888888-8888-8888-8888-888888888888'; // Default admin fallback UUID

  try {
    console.log('Initializing Supabase Admin Client...');
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    console.log(`Checking if auth user ${adminEmail} exists in Supabase...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'ADMIN', name: adminName }
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
        console.log('User already exists in Supabase. Retrieving details...');
        const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        const existing = usersList?.users.find((u: any) => u.email === adminEmail);
        if (existing) {
          userId = existing.id;
        }
      } else {
        throw authError;
      }
    } else if (authData?.user) {
      userId = authData.user.id;
      console.log('Created user in Supabase Auth successfully with ID:', userId);
    }
  } catch (supabaseErr: any) {
    console.warn('Supabase Auth connection failed (Project is likely paused). Seeding user locally in Prisma Database...', supabaseErr.message || supabaseErr);
  }

  // Hash the admin password using PBKDF2
  const salt = require('crypto').randomBytes(16).toString('hex');
  const hash = require('crypto').pbkdf2Sync(adminPassword, salt, 1000, 64, 'sha512').toString('hex');
  const passwordHash = `${salt}:${hash}`;

  // 2. Create user in Prisma DB
  console.log('Upserting user in Postgres Database...');
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      id: userId,
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
      passwordHash,
    }
  });

  console.log('Admin account seeded successfully!');
  console.log('------------------------------------');
  console.log('Login Details:');
  console.log('Portal: Studios Admin');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);
  console.log('------------------------------------');

  await prisma.$disconnect();
  await pool.end();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
});
