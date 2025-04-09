import pg from 'pg';
import { termQuotes, fexQuotes } from '../shared/schema';

// Target database (Neon cloud database)
const targetPool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_HE6ujqc7xZXC@ep-proud-block-a5sc0bmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Logging helper
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Define the structure of tables based on the schema
const tableDefinitions = {
  term: {
    createTableSql: `
      CREATE TABLE IF NOT EXISTS "term" (
        "id" SERIAL PRIMARY KEY,
        "face_amount" INTEGER NOT NULL,
        "sex" TEXT NOT NULL,
        "term_length" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "age" INTEGER NOT NULL,
        "tobacco" TEXT NOT NULL,
        "company" TEXT NOT NULL,
        "plan_name" TEXT NOT NULL,
        "tier_name" TEXT NOT NULL,
        "monthly_rate" DECIMAL(10,2) NOT NULL,
        "annual_rate" DECIMAL(10,2) NOT NULL,
        "warnings" TEXT,
        "logo_url" TEXT,
        "eapp" TEXT
      )
    `,
    sampleData: [
      {
        face_amount: 100000,
        sex: 'male',
        term_length: '20',
        state: 'TX',
        age: 35,
        tobacco: 'none',
        company: 'American Amicable (Term Made Simple)',
        plan_name: 'Term Made Simple',
        tier_name: 'Preferred',
        monthly_rate: 18.95,
        annual_rate: 218.00
      },
      {
        face_amount: 100000,
        sex: 'female',
        term_length: '20',
        state: 'TX',
        age: 35,
        tobacco: 'none',
        company: 'Foresters (Your Term)',
        plan_name: 'Your Term',
        tier_name: 'Preferred',
        monthly_rate: 17.95,
        annual_rate: 205.00
      },
      {
        face_amount: 250000,
        sex: 'male',
        term_length: '20',
        state: 'TX',
        age: 35,
        tobacco: 'none',
        company: 'American Amicable (Term Made Simple)',
        plan_name: 'Term Made Simple',
        tier_name: 'Preferred',
        monthly_rate: 32.50,
        annual_rate: 374.00
      },
      {
        face_amount: 100000,
        sex: 'male',
        term_length: '20',
        state: 'TX',
        age: 45,
        tobacco: 'none',
        company: 'American Amicable (Term Made Simple)',
        plan_name: 'Term Made Simple',
        tier_name: 'Preferred',
        monthly_rate: 32.85,
        annual_rate: 378.00
      },
      {
        face_amount: 100000,
        sex: 'male',
        term_length: '20',
        state: 'TX',
        age: 35,
        tobacco: 'tobacco',
        company: 'American Amicable (Term Made Simple)',
        plan_name: 'Term Made Simple',
        tier_name: 'Tobacco',
        monthly_rate: 45.65,
        annual_rate: 525.00
      }
    ]
  },
  fex: {
    createTableSql: `
      CREATE TABLE IF NOT EXISTS "fex" (
        "id" SERIAL PRIMARY KEY,
        "face_amount" INTEGER NOT NULL,
        "sex" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "age" INTEGER NOT NULL,
        "tobacco" TEXT NOT NULL,
        "underwriting_class" TEXT NOT NULL,
        "company" TEXT NOT NULL,
        "plan_name" TEXT NOT NULL,
        "tier_name" TEXT NOT NULL,
        "monthly_rate" DECIMAL(10,2) NOT NULL,
        "annual_rate" DECIMAL(10,2) NOT NULL,
        "warnings" TEXT,
        "logo_url" TEXT,
        "eapp" TEXT
      )
    `,
    sampleData: [
      {
        face_amount: 15000,
        sex: 'male',
        state: 'TX',
        age: 60,
        tobacco: 'tobacco',
        underwriting_class: 'Standard',
        company: 'American Amicable (Senior Choice)',
        plan_name: 'Senior Choice',
        tier_name: 'Standard Tobacco',
        monthly_rate: 116.35,
        annual_rate: 1339.00
      },
      {
        face_amount: 15000,
        sex: 'female',
        state: 'TX',
        age: 60,
        tobacco: 'none',
        underwriting_class: 'Standard',
        company: 'American Amicable (Senior Choice)',
        plan_name: 'Senior Choice',
        tier_name: 'Standard',
        monthly_rate: 65.75,
        annual_rate: 756.00
      },
      {
        face_amount: 25000,
        sex: 'male',
        state: 'TX',
        age: 65,
        tobacco: 'none',
        underwriting_class: 'Standard',
        company: 'Foresters (PlanRight)',
        plan_name: 'PlanRight',
        tier_name: 'Standard',
        monthly_rate: 135.12,
        annual_rate: 1555.00
      }
    ]
  },
  conditions: {
    createTableSql: `
      CREATE TABLE IF NOT EXISTS "conditions" (
        "id" SERIAL PRIMARY KEY,
        "condition_name" TEXT NOT NULL,
        "condition_category" TEXT NOT NULL,
        "description" TEXT
      )
    `,
    sampleData: [
      {
        condition_name: 'Diabetes Type 1',
        condition_category: 'Endocrine',
        description: 'Insulin-dependent diabetes'
      },
      {
        condition_name: 'Hypertension',
        condition_category: 'Cardiovascular',
        description: 'High blood pressure'
      },
      {
        condition_name: 'Asthma',
        condition_category: 'Respiratory',
        description: 'Chronic lung condition'
      }
    ]
  }
};

// Create table in target database
async function createTableIfNotExists(client, tableName, definition) {
  try {
    await client.query(definition.createTableSql);
    log(`Created or confirmed table: ${tableName}`);
    return true;
  } catch (error) {
    log(`Error creating table ${tableName}: ${error.message}`);
    throw error;
  }
}

// Insert data into table
async function insertData(client, tableName, data) {
  if (data.length === 0) {
    log(`No data to insert for table: ${tableName}`);
    return 0;
  }
  
  log(`Inserting ${data.length} rows into table: ${tableName}`);
  
  // Clear existing data
  await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
  
  let totalInserted = 0;
  
  for (const item of data) {
    const columns = Object.keys(item);
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const values = columns.map(col => item[col]);
    
    const insertQuery = `
      INSERT INTO "${tableName}" (${columnNames})
      VALUES (${placeholders})
      RETURNING id
    `;
    
    try {
      const result = await client.query(insertQuery, values);
      totalInserted++;
      if (totalInserted % 10 === 0 || totalInserted === data.length) {
        log(`Inserted ${totalInserted}/${data.length} rows into ${tableName}`);
      }
    } catch (error) {
      log(`Error inserting into ${tableName}: ${error.message}`);
      console.error(error);
    }
  }
  
  return totalInserted;
}

// Check if a table exists
async function tableExists(client, tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `;
  
  const result = await client.query(query, [tableName]);
  return result.rows[0].exists;
}

// Main migration function
async function migrateToNeon() {
  let client;
  
  try {
    // Connect to Neon database
    client = await targetPool.connect();
    log('Connected to Neon database');
    
    // Get list of tables that need to be created
    const tables = Object.keys(tableDefinitions);
    log(`Preparing to create/populate ${tables.length} tables: ${tables.join(', ')}`);
    
    // Create and populate each table
    let totalRowsInserted = 0;
    
    for (const tableName of tables) {
      const exists = await tableExists(client, tableName);
      if (exists) {
        log(`Table ${tableName} already exists in Neon database`);
      } else {
        log(`Creating table: ${tableName}`);
        await createTableIfNotExists(client, tableName, tableDefinitions[tableName]);
      }
      
      // Insert data
      const rowsInserted = await insertData(
        client, 
        tableName, 
        tableDefinitions[tableName].sampleData
      );
      
      totalRowsInserted += rowsInserted;
      log(`Completed population of table: ${tableName} - ${rowsInserted} rows`);
    }
    
    log(`Migration completed successfully. Total rows inserted: ${totalRowsInserted}`);
    
    // Verify data was inserted by counting rows in each table
    for (const tableName of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      log(`${tableName} table now has ${countResult.rows[0].count} rows`);
    }
    
  } catch (error) {
    log(`Migration failed: ${error.message}`);
    console.error(error);
  } finally {
    // Release client
    if (client) client.release();
    
    // Close pool
    await targetPool.end();
    log('Database connection closed');
  }
}

// Run the migration
migrateToNeon().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 