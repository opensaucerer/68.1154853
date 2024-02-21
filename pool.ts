// db.ts
import { createPool } from 'mysql2/promise';
import env from './env';

// Create a connection pool
const pool = createPool({
  host: env.MYSQL_HOST,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql: string, values?: any[]) {
  const [results] = await pool.query(sql, values);
  return results;
}

export async function execute(sql: string, values?: any[]) {
  const [results] = await pool.execute(sql, values);
  return results;
}

export async function close() {
  await pool.end();
}
