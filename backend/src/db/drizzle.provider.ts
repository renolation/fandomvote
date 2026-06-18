import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Injection token cho Nest DI.
export const DRIZZLE = Symbol('DRIZZLE');

// pgBouncer transaction mode trong prod → CHỈ pg_advisory_xact_lock (§11).
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://fdv:fdv@localhost:5432/fdv',
});

export const db = drizzle(pool, { schema, casing: 'snake_case' });

// Khớp đúng member đầu của DbOrTx (gồm $client) để truyền db vào service phụ — §1.2.
export type Database = typeof db;
