import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';
import { execSync } from 'child_process';

let pool: Pool | null = null;
let envLoaded = false;

interface DatabaseConfig {
  connectionString: string;
}

// 加载环境变量
function loadEnv(): void {
  if (envLoaded) return;

  try {
    try {
      require('dotenv').config();
    } catch {
      // dotenv not available
    }

    // 尝试从 coze workload identity 获取环境变量
    try {
      const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    pass
`;
      const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.startsWith('#') || !line.includes('=')) continue;
        const eqIndex = line.indexOf('=');
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    } catch {
      // Ignore errors
    }

    envLoaded = true;
  } catch {
    // Silently fail
  }
}

// 获取数据库配置
function getDatabaseConfig(): DatabaseConfig {
  loadEnv();
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  return { connectionString };
}

// 获取连接池
function getPool(): Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// 查询结果类型
interface QueryResult<T = any> {
  data: T | T[] | null;
  error: Error | null;
  count?: number | null;
}

// 操作类型
type OperationType = 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null;

// 查询构建器 - 模拟 Supabase API
class QueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private tableName: string;
  private conditions: string[] = [];
  private conditionValues: any[] = [];
  private orderClause: string = '';
  private limitClause: string = '';
  private offsetClause: string = '';
  private selectFields: string = '*';
  private client: PoolClient | null = null;
  
  // 操作类型和数据
  private operationType: OperationType = 'select';
  private updateData: any = null;
  private insertData: any = null;
  private upsertOptions: { onConflict?: string } = {};

  constructor(tableName: string, client?: PoolClient) {
    this.tableName = tableName;
    this.client = client || null;
  }

  // 设置客户端（用于事务）
  setClient(client: PoolClient) {
    this.client = client;
    return this;
  }

  // 选择字段
  select(fields: string = '*') {
    if (fields !== '*') {
      this.selectFields = fields;
    }
    this.operationType = 'select';
    return this;
  }

  // WHERE 条件
  eq(column: string, value: any) {
    this.conditions.push(`${column} = $${this.conditionValues.length + 1}`);
    this.conditionValues.push(value);
    return this;
  }

  neq(column: string, value: any) {
    this.conditions.push(`${column} != $${this.conditionValues.length + 1}`);
    this.conditionValues.push(value);
    return this;
  }

  gt(column: string, value: any) {
    this.conditions.push(`${column} > $${this.conditionValues.length + 1}`);
    this.conditionValues.push(value);
    return this;
  }

  gte(column: string, value: any) {
    this.conditions.push(`${column} >= $${this.conditionValues.length + 1}`);
    this.conditionValues.push(value);
    return this;
  }

  lt(column: string, value: any) {
    this.conditions.push(`${column} < $${this.conditionValues.length + 1}`);
    this.conditionValues.push(value);
    return this;
  }

  lte(column: string, value: any) {
    this.conditions.push(`${column} <= $${this.conditionValues.length + 1}`);
    this.conditionValues.push(value);
    return this;
  }

  like(column: string, pattern: string) {
    this.conditions.push(`${column} LIKE $${this.conditionValues.length + 1}`);
    this.conditionValues.push(pattern);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.conditions.push(`${column} ILIKE $${this.conditionValues.length + 1}`);
    this.conditionValues.push(pattern);
    return this;
  }

  in(column: string, values: any[]) {
    const placeholders = values.map((_, i) => `$${this.conditionValues.length + i + 1}`).join(', ');
    this.conditions.push(`${column} IN (${placeholders})`);
    this.conditionValues.push(...values);
    return this;
  }

  is(column: string, value: null | boolean) {
    if (value === null) {
      this.conditions.push(`${column} IS NULL`);
    } else {
      this.conditions.push(`${column} IS ${value ? 'TRUE' : 'FALSE'}`);
    }
    return this;
  }

  // OR 条件
  or(conditions: string) {
    // 解析 Supabase 风格的 OR 条件
    this.conditions.push(`(${conditions})`);
    return this;
  }

  // 排序
  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? 'DESC' : 'ASC';
    this.orderClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  // 限制
  limit(count: number) {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  // 偏移
  offset(count: number) {
    this.offsetClause = `OFFSET ${count}`;
    return this;
  }

  // 构建 SELECT 查询
  private buildSelectQuery(): { text: string; values: any[] } {
    let sql = `SELECT ${this.selectFields} FROM ${this.tableName}`;
    
    if (this.conditions.length > 0) {
      sql += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    
    if (this.orderClause) {
      sql += ` ${this.orderClause}`;
    }
    
    if (this.limitClause) {
      sql += ` ${this.limitClause}`;
    }
    
    if (this.offsetClause) {
      sql += ` ${this.offsetClause}`;
    }
    
    return { text: sql, values: this.conditionValues };
  }

  // 执行 SELECT 查询
  private async executeSelect(): Promise<QueryResult<T>> {
    try {
      const pool = getPool();
      const { text: sql, values } = this.buildSelectQuery();
      
      const client = this.client || await pool.connect();
      try {
        const result: PgQueryResult = await client.query(sql, values);
        return { data: result.rows as T[], error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // 单行查询
  async maybeSingle(): Promise<QueryResult<T>> {
    this.limitClause = 'LIMIT 1';
    const result = await this.executeSelect();
    return {
      data: Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null,
      error: result.error,
      count: result.count
    };
  }

  // 单行查询（期望必须有一行）
  async single(): Promise<QueryResult<T>> {
    const result = await this.maybeSingle();
    if (!result.error && result.data === null) {
      return { data: null, error: new Error('No rows found'), count: 0 };
    }
    return result;
  }

  // 插入 - 返回 this 以支持链式调用
  insert(data: any): this {
    this.insertData = data;
    this.operationType = 'insert';
    return this;
  }

  // 执行插入
  private async executeInsert(): Promise<QueryResult<T>> {
    if (!this.insertData) {
      return { data: null, error: new Error('No data to insert'), count: null };
    }

    try {
      const pool = getPool();
      const data = this.insertData;
      
      // 支持批量插入
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) {
        return { data: null, error: new Error('No data to insert'), count: null };
      }

      const columns = Object.keys(rows[0]);
      const values: any[] = [];
      const placeholders: string[] = [];
      
      rows.forEach((row, rowIndex) => {
        const rowPlaceholders = columns.map((col, colIndex) => {
          values.push(row[col]);
          return `$${rowIndex * columns.length + colIndex + 1}`;
        });
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      });

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`;
      
      const client = this.client || await pool.connect();
      try {
        const result: PgQueryResult = await client.query(sql, values);
        return { data: Array.isArray(data) ? result.rows as T[] : result.rows[0] as T, error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // 更新 - 返回 this 以支持链式调用
  update(data: any): this {
    this.updateData = data;
    this.operationType = 'update';
    return this;
  }

  // 执行更新
  private async executeUpdate(): Promise<QueryResult<T>> {
    if (!this.updateData) {
      return { data: null, error: new Error('No data to update'), count: null };
    }

    if (this.conditions.length === 0) {
      return { data: null, error: new Error('Update requires at least one condition'), count: null };
    }

    try {
      const pool = getPool();
      const columns = Object.keys(this.updateData);
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const values = Object.values(this.updateData);
      
      const whereClause = this.conditions.map((c, i) => {
        // 调整参数索引
        return c.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + values.length}`);
      }).join(' AND ');
      
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
      const allValues = [...values, ...this.conditionValues];
      
      const client = this.client || await pool.connect();
      try {
        const result: PgQueryResult = await client.query(sql, allValues);
        return { data: result.rows as T[], error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // 删除 - 返回 this 以支持链式调用
  delete(): this {
    this.operationType = 'delete';
    return this;
  }

  // 执行删除
  private async executeDelete(): Promise<QueryResult<T>> {
    if (this.conditions.length === 0) {
      return { data: null, error: new Error('Delete requires at least one condition'), count: null };
    }

    try {
      const pool = getPool();
      const sql = `DELETE FROM ${this.tableName} WHERE ${this.conditions.join(' AND ')} RETURNING *`;
      
      const client = this.client || await pool.connect();
      try {
        const result: PgQueryResult = await client.query(sql, this.conditionValues);
        return { data: result.rows as T[], error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // Upsert - 支持自定义冲突字段（支持复合字段如 'role_id,permission_id'）
  upsert(data: any, options?: { onConflict?: string }): this {
    this.insertData = data;
    this.upsertOptions = options || {};
    this.operationType = 'upsert';
    return this;
  }

  // 执行 Upsert
  private async executeUpsert(): Promise<QueryResult<T>> {
    if (!this.insertData) {
      return { data: null, error: new Error('No data to upsert'), count: null };
    }

    try {
      const pool = getPool();
      const data = this.insertData;
      const columns = Object.keys(data);
      const placeholders = columns.map((col, i) => `$${i + 1}`).join(', ');
      const values = Object.values(data);
      
      // 支持自定义冲突字段，默认为 'id'
      // 支持复合字段如 'role_id,permission_id'
      const conflictColumns = this.upsertOptions.onConflict || 'id';
      
      // 更新子句：排除冲突字段本身
      const conflictColumnList = conflictColumns.split(',').map(c => c.trim());
      const updateClause = columns
        .filter(col => !conflictColumnList.includes(col))
        .map((col) => `${col} = EXCLUDED.${col}`)
        .join(', ');
      
      const sql = `
        INSERT INTO ${this.tableName} (${columns.join(', ')}) 
        VALUES (${placeholders}) 
        ON CONFLICT (${conflictColumns}) DO UPDATE SET ${updateClause}
        RETURNING *
      `;
      
      const client = this.client || await pool.connect();
      try {
        const result: PgQueryResult = await client.query(sql, values);
        return { data: result.rows[0] as T, error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // 实现 PromiseLike 接口 - 让对象可以被 await
  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    // 根据操作类型执行相应的查询
    let promise: Promise<QueryResult<T>>;
    
    switch (this.operationType) {
      case 'insert':
        promise = this.executeInsert();
        break;
      case 'update':
        promise = this.executeUpdate();
        break;
      case 'delete':
        promise = this.executeDelete();
        break;
      case 'upsert':
        promise = this.executeUpsert();
        break;
      case 'select':
      default:
        promise = this.executeSelect();
        break;
    }
    
    return promise.then(onfulfilled, onrejected);
  }
}

// 模拟 Supabase Client
class PgClient {
  private client: PoolClient | null = null;

  // 设置客户端（用于事务）
  setClient(client: PoolClient) {
    this.client = client;
    return this;
  }

  // 从表查询
  from(tableName: string) {
    const builder = new QueryBuilder(tableName, this.client || undefined);
    return builder;
  }

  // 获取连接池
  getPool(): Pool {
    return getPool();
  }

  // 获取原始客户端
  async getClient(): Promise<PoolClient> {
    return getPool().connect();
  }

  // 事务
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // RPC 调用（模拟）
  async rpc(fn: string, params?: any): Promise<{ data: any | null; error: Error | null }> {
    // 对于本地数据库，直接调用对应的函数
    // 这里暂时返回错误，后续可以根据需要实现
    console.log(`RPC call: ${fn}`, params);
    return { data: null, error: new Error(`RPC function ${fn} not implemented`) };
  }
}

// 单例客户端
let pgClient: PgClient | null = null;

// 获取 PostgreSQL 客户端
function getPgClient(): PgClient {
  if (!pgClient) {
    pgClient = new PgClient();
  }
  return pgClient;
}

// 检查是否应该使用本地数据库
function shouldUseLocalDatabase(): boolean {
  // 优先使用 USE_LOCAL_DATABASE 环境变量
  const useLocal = process.env.USE_LOCAL_DATABASE;
  if (useLocal === 'true' || useLocal === '1') {
    return true;
  }
  
  // 如果没有设置 USE_LOCAL_DATABASE，检查 DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    // 如果 DATABASE_URL 包含 localhost 或 127.0.0.1，使用本地数据库
    return databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
  }
  
  return false;
}

// 关闭连接池
async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export {
  loadEnv,
  getDatabaseConfig,
  getPool,
  getPgClient,
  PgClient,
  QueryBuilder,
  shouldUseLocalDatabase,
  closePool
};
