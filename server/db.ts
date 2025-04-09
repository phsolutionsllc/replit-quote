import pg from 'pg';
import { performance } from 'perf_hooks';

// Get Pool and Client from pg namespace
const { Pool, Client } = pg;

// Type definition for clarity
type PgClient = typeof Client.prototype;

// Properly configured connection pool with limits and idle timeout
export const db = new Pool({
  // Connection string
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_HE6ujqc7xZXC@ep-proud-block-a5sc0bmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection not established
});

// Create a dedicated non-pooler connection for quote queries
// This bypasses the pooler endpoint which is causing the bottleneck
let dedicatedClient: PgClient | null = null;
let clientConnecting = false;
let connectionPromise: Promise<PgClient> | null = null;

// Function to get a dedicated persistent connection
export const getDedicatedClient = async (): Promise<PgClient> => {
  // If we already have a client and it's still connected, use it
  if (dedicatedClient && dedicatedClient.hasOwnProperty('connection') && 
      (dedicatedClient as any).connection?.stream?.readable) {
    return dedicatedClient;
  }
  
  // If a connection is already in progress, wait for it
  if (clientConnecting && connectionPromise) {
    return connectionPromise;
  }
  
  // Otherwise, create a new connection
  console.log('[DB] Creating new dedicated connection to bypass pooler...');
  clientConnecting = true;
  
  // Create new connection promise
  connectionPromise = new Promise<PgClient>((resolve, reject) => {
    // Hardcode the direct endpoint instead of trying to modify the pooler URL
    // This ensures we connect directly to the database server
    const connStr = 'postgresql://neondb_owner:npg_HE6ujqc7xZXC@ep-proud-block-a5sc0bmn.us-east-2.aws.neon.tech/neondb?sslmode=require';
    console.log('[DB] Using direct connection string: ', connStr);
    
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });
    
    client.connect()
      .then(() => {
        console.log('[DB] Dedicated connection established successfully');
        
        // Set up connection monitoring - PG will automatically reconnect
        client.on('error', (err) => {
          console.error('[DB] Dedicated connection error:', err);
          // On error, clear and attempt to reconnect
          dedicatedClient = null;
          connectionPromise = null;
          clientConnecting = false;
          
          // Try to reconnect after a short delay
          setTimeout(() => {
            console.log('[DB] Attempting to reconnect dedicated client after error...');
            getDedicatedClient().catch(err => {
              console.error('[DB] Failed to reconnect dedicated client:', err);
            });
          }, 1000);
        });
        
        // Set up a keepalive ping every 30 seconds
        const pingInterval = setInterval(() => {
          if (dedicatedClient && dedicatedClient.hasOwnProperty('connection') && 
              (dedicatedClient as any).connection?.stream?.readable) {
            client.query('SELECT 1')
              .then(() => console.log('[DB] Keepalive ping successful'))
              .catch(err => {
                console.error('[DB] Keepalive ping failed:', err);
                clearInterval(pingInterval);
                
                // Trigger reconnection
                dedicatedClient = null;
                connectionPromise = null;
                clientConnecting = false;
                getDedicatedClient().catch(err => {
                  console.error('[DB] Failed to reconnect after ping failure:', err);
                });
              });
          } else {
            // Connection is no longer valid
            console.log('[DB] Connection appears closed, clearing ping interval');
            clearInterval(pingInterval);
          }
        }, 30000);
        
        dedicatedClient = client;
        clientConnecting = false;
        resolve(client);
      })
      .catch(err => {
        console.error('[DB] Failed to establish dedicated connection:', err);
        clientConnecting = false;
        connectionPromise = null;
        reject(err);
      });
  });
  
  return connectionPromise;
};

// Modified query function that uses the dedicated connection
export const executeFastQuery = async (query: string, params?: any[]) => {
  const start = performance.now();
  console.log('[DB] Starting fast query execution...');
  
  try {
    // Time how long it takes to get the dedicated client
    const clientStart = performance.now();
    
    // Try to get a dedicated client with a timeout
    const clientPromise = getDedicatedClient();
    
    // Create a timeout promise
    const timeoutPromise = new Promise<PgClient>((_, reject) => {
      setTimeout(() => {
        reject(new Error('[DB] Timed out waiting for dedicated connection after 2000ms'));
      }, 2000);
    });
    
    // Race between the client and the timeout
    const client = await Promise.race([clientPromise, timeoutPromise]);
    
    const clientEnd = performance.now();
    console.log(`[DB] Got dedicated client in ${(clientEnd - clientStart).toFixed(2)}ms`);
    
    // Time the actual query execution
    const queryStart = performance.now();
    console.log(`[DB] Executing query using dedicated connection: ${query.replace(/\s+/g, ' ')}`);
    
    const result = await client.query(query, params);
    
    const queryEnd = performance.now();
    console.log(`[DB] Query execution took ${(queryEnd - queryStart).toFixed(2)}ms`);
    console.log(`[DB] Found ${result.rowCount} rows`);
    
    const end = performance.now();
    console.log(`[DB] Total query process time: ${(end - start).toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    console.error('[DB] Error executing fast query:', error);
    console.log('[DB] Attempting to reset connection state...');
    
    // If connection failed, clear it so we'll create a new one next time
    dedicatedClient = null;
    connectionPromise = null;
    clientConnecting = false;
    
    // Try to establish a new connection for next time
    setTimeout(() => {
      console.log('[DB] Attempting to re-establish dedicated connection after error...');
      getDedicatedClient().catch(err => {
        console.error('[DB] Failed to re-establish connection after error:', err);
      });
    }, 1000);
    
    throw error;
  }
};

// Keep original timedQuery for compatibility
export const timedQuery = async (query: string, params?: any[]) => {
  // Use our new fast execution method instead
  return executeFastQuery(query, params);
};

// Set up event listeners to monitor pool behavior
db.on('connect', (client) => {
  console.log('[DB POOL] New client connected to database');
});

db.on('acquire', () => {
  const { totalCount, idleCount, waitingCount } = db;
  console.log(`[DB POOL] Client acquired from pool - total: ${totalCount}, idle: ${idleCount}, waiting: ${waitingCount}`);
});

db.on('remove', () => {
  const { totalCount, idleCount, waitingCount } = db;
  console.log(`[DB POOL] Client removed from pool - total: ${totalCount}, idle: ${idleCount}, waiting: ${waitingCount}`);
});

db.on('error', (err, client) => {
  console.error('[DB POOL] Error on idle client', err);
});

// Function to check pool health every minute
setInterval(() => {
  const { totalCount, idleCount, waitingCount } = db;
  console.log(`[DB POOL] Health check - total: ${totalCount}, idle: ${idleCount}, waiting: ${waitingCount}`);
}, 60000);

// Add query explainer to analyze performance issues
export const explainQuery = async (query: string, params?: any[]) => {
  try {
    console.log('[DB] Running EXPLAIN ANALYZE...');
    const explainQuery = `EXPLAIN ANALYZE ${query}`;
    const result = await executeFastQuery(explainQuery, params);
    
    console.log('===== QUERY EXECUTION PLAN =====');
    result.rows.forEach((row: { [key: string]: any }) => {
      console.log(row["QUERY PLAN"]);
    });
    console.log('================================');
    
    return result.rows.map((row: { [key: string]: any }) => row["QUERY PLAN"]);
  } catch (error) {
    console.error('[DB] Error running EXPLAIN ANALYZE:', error);
    return [];
  }
};

// Function to check for indexes on the critical columns
export const checkIndexes = async () => {
  const client = await db.connect();
  try {
    console.log('[DB] Checking indexes on term and fex tables...');
    
    // Query to get all indexes on both tables
    const indexQuery = `
      SELECT
        t.relname AS table_name,
        i.relname AS index_name,
        a.attname AS column_name
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname IN ('term', 'fex')
      ORDER BY
        t.relname,
        i.relname;
    `;
    
    const result = await client.query(indexQuery);
    
    console.log('===== DATABASE INDEXES =====');
    let currentTable = '';
    
    result.rows.forEach((row: { table_name: string, index_name: string, column_name: string }) => {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        console.log(`\nTable: ${currentTable}`);
      }
      console.log(`  Index: ${row.index_name}, Column: ${row.column_name}`);
    });
    
    console.log('\n===== MISSING RECOMMENDED INDEXES =====');
    // Check if critical columns have indexes
    const criticalColumns = ['face_amount', 'sex', 'age', 'tobacco', 'term_length', 'underwriting_class'];
    
    // Group by table and column
    const indexedColumns = new Map<string, boolean>();
    result.rows.forEach((row: { table_name: string, column_name: string }) => {
      const key = `${row.table_name}_${row.column_name}`;
      indexedColumns.set(key, true);
    });
    
    // Check for missing indexes
    let missingIndexes = false;
    
    for (const table of ['term', 'fex']) {
      for (const column of criticalColumns) {
        // Skip term_length for fex and underwriting_class for term
        if ((table === 'fex' && column === 'term_length') || 
            (table === 'term' && column === 'underwriting_class')) {
          continue;
        }
        
        const key = `${table}_${column}`;
        if (!indexedColumns.has(key)) {
          console.log(`Missing index on ${table}.${column}`);
          missingIndexes = true;
        }
      }
    }
    
    if (!missingIndexes) {
      console.log('All critical columns are indexed.');
    }
    
    console.log('=============================');
    
    return result.rows;
  } finally {
    client.release();
  }
};

// Run index check on startup
checkIndexes().catch(error => {
  console.error('[DB] Error checking indexes:', error);
});
