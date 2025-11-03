// Reference: javascript_database blueprint
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect if this is a local PostgreSQL or Neon cloud database
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech');
const isLocalDatabase = process.env.DATABASE_URL.includes('localhost') || 
                         process.env.DATABASE_URL.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

let pool: any;
let db: any;

if (isNeonDatabase) {
  // Use Neon serverless driver for cloud database
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
  console.log('🔗 Using Neon serverless driver (cloud database)');
} else {
  // Use standard PostgreSQL driver for local database
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg({ client: pool, schema });
  console.log('🔗 Using node-postgres driver (local database)');
}

export { pool, db };
