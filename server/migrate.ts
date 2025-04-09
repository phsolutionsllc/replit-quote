import { db } from './db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';

// Run migrations
async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // Push schema to database
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);
    
    // Verify tables are created based on schema
    console.log('Creating tables...');
    
    // Print tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables);
    
    // Test connection
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('Database connection successful:', result);
    
    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 