import pg from 'pg';
const { Pool } = pg;

// Target Neon database
const neonPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_HE6ujqc7xZXC@ep-proud-block-a5sc0bmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Sample term data based on real structure
const termData = [
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
];

// Sample FEX data based on real structure
const fexData = [
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
];

// Bulk insert function with better error handling
async function insertData(client, tableName, data) {
  for (const row of data) {
    try {
      const columns = Object.keys(row).join(', ');
      const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(row);
      
      const query = `
        INSERT INTO ${tableName} (${columns})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;
      
      await client.query(query, values);
      console.log(`Inserted record into ${tableName}`);
    } catch (error) {
      console.error(`Error inserting into ${tableName}:`, error.message);
    }
  }
}

async function populateDatabase() {
  const client = await neonPool.connect();
  
  try {
    console.log('Connected to Neon database');

    // Insert term data
    console.log('Importing term data...');
    await insertData(client, 'term', termData);
    
    // Insert FEX data
    console.log('Importing FEX data...');
    await insertData(client, 'fex', fexData);
    
    // Verify data was inserted
    const termCount = await client.query('SELECT COUNT(*) FROM term');
    console.log('Term table row count:', termCount.rows[0].count);
    
    const fexCount = await client.query('SELECT COUNT(*) FROM fex');
    console.log('FEX table row count:', fexCount.rows[0].count);
    
    console.log('Data import completed');
  } catch (error) {
    console.error('Import error:', error.message);
  } finally {
    client.release();
    await neonPool.end();
  }
}

// Run the data import
populateDatabase(); 