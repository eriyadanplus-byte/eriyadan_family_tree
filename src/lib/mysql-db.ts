// Simple in-memory database for development testing
// Returns empty data - Supabase is now the active database

const members: Map<string, any> = new Map();
const users: Map<string, any> = new Map();
const spouses: Map<string, any> = new Map();

export async function query(sql: string, params?: any[]): Promise<any> {
  const sqlUpper = sql.toUpperCase().trim();
  
  console.log('[mock-db] query:', sql.substring(0, 100));
  
  if (sqlUpper.startsWith('SELECT')) {
    if (sql.includes('members')) {
      return [];
    }
    if (sql.includes('spouses')) {
      return [];
    }
    if (sql.includes('users')) {
      return [];
    }
    return [];
  }
  
  if (sqlUpper.startsWith('INSERT')) {
    const id = crypto.randomUUID();
    return { changes: 1, insertId: id };
  }
  
  if (sqlUpper.startsWith('UPDATE')) {
    return { changes: 0 };
  }
  
  return { changes: 0 };
}

export async function getConnection(): Promise<any> {
  return null;
}

export async function initDB(): Promise<void> {
  console.log('[mock-db] Initialized (Supabase is active database)');
}