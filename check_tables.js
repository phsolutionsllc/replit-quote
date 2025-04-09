const { Pool } = require('pg');

// Connect to the Neon database
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_HE6ujqc7xZXC@ep-proud-block-a5sc0bmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkTablesAndValues() {
  const client = await pool.connect();
  try {
    console.log('Connected to Neon database');
    
    // Check if tables exist
    const tableResults = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in the database:');
    tableResults.rows.forEach(row => console.log(` - ${row.table_name}`));
    
    // Try to get one record from term
    try {
      const termResult = await client.query('SELECT * FROM term LIMIT 1');
      if (termResult.rows.length > 0) {
        console.log('\nFound record in term table:');
        console.log(termResult.rows[0]);
      } else {
        console.log('\nTerm table exists but has no records');
      }
    } catch (err) {
      console.log('\nError querying term table:', err.message);
    }
    
    // Try to get one record from fex
    try {
      const fexResult = await client.query('SELECT * FROM fex LIMIT 1');
      if (fexResult.rows.length > 0) {
        console.log('\nFound record in fex table:');
        console.log(fexResult.rows[0]);
      } else {
        console.log('\nFex table exists but has no records');
      }
    } catch (err) {
      console.log('\nError querying fex table:', err.message);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTablesAndValues().catch(console.error);
