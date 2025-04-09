const pg from 'pg';
const { drizzle } from 'drizzle-orm/node-postgres';
const * as schema from "../shared/schema";

// Use the Neon connection string directly
const connectionString = 'postgresql://neondb_owner:npg_HE6ujqc7xZXC@ep-proud-block-a5sc0bmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Initialize PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Neon
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to database at:', res.rows[0].now);
  }
});

// Initialize Drizzle with the database connection
module.exports.db = drizzle(pool, { 
  schema,
  logger: true // Enable query logging for debugging
});
