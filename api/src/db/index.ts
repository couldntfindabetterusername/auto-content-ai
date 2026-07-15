import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import postgres from 'postgres';
import * as schema from './schema';

export async function createDb() {
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(migrationClient, { schema });
  await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
  await migrationClient.end();

  const client = postgres(process.env.DATABASE_URL!);
  return drizzle(client, { schema });
}

export function connectDb() {
  const client = postgres(process.env.DATABASE_URL!);
  return drizzle(client, { schema });
}