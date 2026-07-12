import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function createDb() {
  const client = postgres(process.env.DATABASE_URL!);
  return drizzle(client, { schema });
}
