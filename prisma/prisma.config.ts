import dotenv from 'dotenv';
import path from 'path';

// Load project .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Supabase provides two useful URLs in this project:
// - DATABASE_URL: connection using pgbouncer pooler (recommended for app connections)
// - DIRECT_URL: direct Postgres connection (used for migrations)
// For Prisma Migrate the CLI expects PRISMA_MIGRATE_URL; populate it here.
if (!process.env.PRISMA_MIGRATE_URL) {
  process.env.PRISMA_MIGRATE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
}

export default {
  migrate: {
    url: process.env.PRISMA_MIGRATE_URL,
  },
};
