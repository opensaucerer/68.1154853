import { PoolConnection } from 'mysql2/promise';
import * as db from './pool';

export interface IConflict {
  yes: boolean;
  on?: string;
  do?: string;
}

/**
 * Starts a new transaction.
 */
export async function begin() {
  return db.begin();
}

/**
 * Inserts a new record into the database on the specified table.
 *
 * @param object
 * @param table
 * @param conflict
 * @returns
 */
export async function insert<T extends {}>(
  object: T,
  table: string,
  conflict?: IConflict,
  tx?: PoolConnection
) {
  const keys = Object.keys(object);
  const values = Object.values(object);
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys
    .map(() => '?')
    .join(', ')})`;

  // handle conflict
  if (conflict && conflict.yes) {
    if (conflict.on && conflict.do) {
      return (tx ?? db).execute(
        `${sql} ON DUPLICATE KEY UPDATE ${conflict.do}`,
        values
      );
    }
    return (tx ?? db).execute(
      `${sql} ON DUPLICATE KEY UPDATE ${keys
        .map((key) => `${key} = VALUES(${key})`)
        .join(', ')}`,
      values
    );
  }

  return (tx ?? db).execute(sql, values);
}

/**
 * Inserts multiple records into the database on the specified table.
 *
 * @param objects
 * @param table
 * @param conflict
 * @returns
 */
export async function insertMany<T extends {}>(
  objects: T[],
  table: string,
  conflict?: IConflict,
  tx?: PoolConnection
) {
  const keys = Object.keys(objects[0]);
  const values = objects.map((object) => Object.values(object));
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${values
    .map(() => `(${keys.map(() => '?').join(', ')})`)
    .join(', ')}`;

  if (conflict && conflict.yes) {
    if (conflict.on && conflict.do) {
      return (tx ?? db).execute(
        `${sql} ON DUPLICATE KEY UPDATE ${conflict.do}`,
        values.flat()
      );
    }
    return (tx ?? db).execute(
      `${sql} ON DUPLICATE KEY UPDATE ${keys
        .map((key) => `${key} = VALUES(${key})`)
        .join(', ')}`,
      values.flat()
    );
  }

  return (tx ?? db).execute(sql, values.flat());
}

/**
 * Updates a record in the database on the specified table.
 *
 * @param object
 * @param where
 * @param table
 * @returns
 */
export async function update<T extends {}>(
  object: T,
  where: Partial<T>,
  table: string,
  tx?: PoolConnection
) {
  const keys = Object.keys(object);
  const values = Object.values(object);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  const sql = `UPDATE ${table} SET ${keys
    .map((key) => `${key} = ?`)
    .join(', ')} WHERE ${whereKeys.map((key) => `${key} = ?`).join(' AND ')}`;
  return (tx ?? db).execute(sql, [...values, ...whereValues]);
}

/**
 * Removes a record from the database on the specified table.
 *
 * @param where
 * @param table
 * @returns
 */
export async function remove<T extends {}>(
  where: Partial<T>,
  table: string,
  tx?: PoolConnection
) {
  const keys = Object.keys(where);
  const values = Object.values(where);
  const sql = `DELETE FROM ${table} WHERE ${keys
    .map((key) => `${key} = ?`)
    .join(' AND ')}`;
  return (tx ?? db).execute(sql, values);
}

/**
 * Counts the number of records in the database on the specified table.
 *
 * @param where
 * @param table
 * @returns
 */
export async function count<T extends {}>(
  where: Partial<T>,
  table: string,
  tx?: PoolConnection
) {
  const keys = Object.keys(where);
  const values = Object.values(where);
  const sql = `SELECT COUNT(*) FROM ${table} WHERE ${keys
    .map((key) => `${key} = ?`)
    .join(' AND ')}`;
  return (tx ?? db).query(sql, values);
}

export interface IPagination {
  limit: number;
  offset: number;
}

/**
 * Selects a record from the database on the specified table.
 *
 * @param table
 * @param where
 * @param pagination
 * @returns
 */
export async function select<T extends {}>(
  table: string,
  where: Partial<T>,
  pagination: IPagination,
  tx?: PoolConnection
) {
  const keys = Object.keys(where);
  const values = Object.values(where);
  const sql = `SELECT * FROM ${table} WHERE ${keys
    .map((key) => `${key} = ?`)
    .join(' AND ')} LIMIT ? OFFSET ?`;
  return (tx ?? db).query(sql, [
    ...values,
    pagination.limit,
    pagination.offset,
  ]);
}

/**
 * Selects one record from the database on the specified table.
 *
 * @param table
 * @param where
 * @returns
 */
export async function selectOne<T extends {}>(
  table: string,
  where?: Partial<T>,
  tx?: PoolConnection
) {
  const keys = where ? Object.keys(where) : [];
  const values = where ? Object.values(where) : [];
  const sql = `SELECT * FROM ${table} ${
    where ? `WHERE ${keys.map((key) => `${key} = ?`).join(' AND ')}` : ''
  }`;
  return (tx ?? db).query(sql, values);
}

/**
 * Selects one record from the database on the specified table and locks it.
 *
 * @param table
 * @param where
 * @returns
 */
export async function selectOneForUpdate<T extends {}>(
  table: string,
  where?: Partial<T>,
  tx?: PoolConnection
) {
  const keys = where ? Object.keys(where) : [];
  const values = where ? Object.values(where) : [];
  const sql = `SELECT * FROM ${table} ${
    where ? `WHERE ${keys.map((key) => `${key} = ?`).join(' AND ')}` : ''
  } FOR UPDATE`;
  return (tx ?? db).query(sql, values);
}

/**
 * Selects all records from the database on the specified table.
 *
 * @param table
 * @param pagination
 * @returns
 */
export async function selectAll<T extends {}>(
  table: string,
  pagination: IPagination,
  tx?: PoolConnection
) {
  const sql = `SELECT * FROM ${table} LIMIT ? OFFSET ?`;
  return (tx ?? db).query(sql, [pagination.limit, pagination.offset]);
}
