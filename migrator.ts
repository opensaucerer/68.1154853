import fs from 'fs';
import * as db from './pool';

/**
 * Reads the migration.up.sql file and executes the SQL commands in it.
 */
export async function migrate() {
  const sql = fs.readFileSync('migration.sql', 'utf-8');
  await db.execute(sql);
}
