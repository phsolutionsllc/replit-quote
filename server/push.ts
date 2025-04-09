import { db } from './db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  console.log('Pushing schema to database...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
  
  try {
    // Test connection first
    console.log('Testing database connection...');
    const testResult = await db.execute(sql`SELECT 1 as test`);
    console.log('Connection test result:', testResult);
    
    // Create each table from the schema
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create quotes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        quote_type TEXT NOT NULL,
        face_amount INTEGER NOT NULL,
        birthday TEXT NOT NULL,
        gender TEXT NOT NULL,
        tobacco TEXT NOT NULL,
        term_length TEXT,
        underwriting_class TEXT,
        state TEXT NOT NULL,
        health_conditions JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create carriers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS carriers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    
    // Create carrier_preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS carrier_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        carrier_id INTEGER NOT NULL REFERENCES carriers(id),
        is_preferred BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    
    // Create term table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS term (
        id SERIAL PRIMARY KEY,
        face_amount INTEGER NOT NULL,
        sex TEXT NOT NULL,
        term_length TEXT NOT NULL,
        state TEXT NOT NULL,
        age INTEGER NOT NULL,
        tobacco TEXT NOT NULL,
        company TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        tier_name TEXT NOT NULL,
        monthly_rate DECIMAL NOT NULL,
        annual_rate DECIMAL NOT NULL,
        warnings TEXT,
        logo_url TEXT,
        eapp TEXT
      )
    `);
    
    // Create fex table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fex (
        id SERIAL PRIMARY KEY,
        face_amount INTEGER NOT NULL,
        sex TEXT NOT NULL,
        state TEXT NOT NULL,
        age INTEGER NOT NULL,
        tobacco TEXT NOT NULL,
        underwriting_class TEXT NOT NULL,
        company TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        tier_name TEXT NOT NULL,
        monthly_rate DECIMAL NOT NULL,
        annual_rate DECIMAL NOT NULL,
        warnings TEXT,
        logo_url TEXT,
        eapp TEXT
      )
    `);

    // Print tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables created:', tables);
    
    console.log('Schema push complete!');
    process.exit(0);
  } catch (error) {
    console.error('Schema push failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

main(); 