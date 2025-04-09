import { db } from './db';
import { fileURLToPath } from 'url';

/**
 * This script creates indexes on the term and fex tables
 * to optimize query performance.
 */
export async function createIndexes() {
  const client = await db.connect();
  
  try {
    console.log('Starting to create database indexes...');
    
    // Create indexes on the term table
    await client.query(`
      -- Create indexes on term table
      CREATE INDEX IF NOT EXISTS idx_term_face_amount ON term(face_amount);
      CREATE INDEX IF NOT EXISTS idx_term_sex ON term(sex);
      CREATE INDEX IF NOT EXISTS idx_term_age ON term(age);
      CREATE INDEX IF NOT EXISTS idx_term_tobacco ON term(tobacco);
      CREATE INDEX IF NOT EXISTS idx_term_term_length ON term(term_length);
      
      -- Create a compound index for the common query pattern
      CREATE INDEX IF NOT EXISTS idx_term_combined ON term(face_amount, sex, age, tobacco, term_length);
      
      -- Create indexes on fex table
      CREATE INDEX IF NOT EXISTS idx_fex_face_amount ON fex(face_amount);
      CREATE INDEX IF NOT EXISTS idx_fex_sex ON fex(sex);
      CREATE INDEX IF NOT EXISTS idx_fex_age ON fex(age);
      CREATE INDEX IF NOT EXISTS idx_fex_tobacco ON fex(tobacco);
      CREATE INDEX IF NOT EXISTS idx_fex_underwriting_class ON fex(underwriting_class);
      
      -- Create a compound index for the common query pattern
      CREATE INDEX IF NOT EXISTS idx_fex_combined ON fex(face_amount, sex, age, tobacco, underwriting_class);
    `);
    
    console.log('Database indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    client.release();
  }
}

// ES module version of the "is this the main module?" check
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  createIndexes()
    .then(() => {
      console.log('Index creation completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Failed to create indexes:', err);
      process.exit(1);
    });
} 