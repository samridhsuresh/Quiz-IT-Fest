import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
const port = Number(process.env.PGPORT || 5432);

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: url
    ? { url }
    : {
        host: process.env.SQL_HOST || 'localhost',
        port,
        user: process.env.SQL_ADMIN_USER || process.env.SQL_USER,
        password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME || 'postgres',
      },
});
