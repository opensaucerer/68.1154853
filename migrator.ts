import * as fs from 'fs';
import * as db from './pool';
import logger from './logger';

/**
 * Reads the migration.up.sql file and executes the SQL commands in it.
 */
export async function migrate() {
  const sql = fs.readFileSync('migration.sql', 'utf-8');
  const commands = sql.split(';').filter((command) => command.trim() !== '');
  for (const command of commands) {
    await db.query(command);
  }
  logger.info('Migration successful');
}
