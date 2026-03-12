import { Pool, PoolClient, QueryResult } from 'pg';
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

// 查询构建器 - 模拟 Supabase API
class QueryBuilder {
  private tableName: string;
  private conditions: string[] = [];
  private conditionValues: any[] = [];
  private orderClause: string = '';
  private limitClause: string = '';
  private offsetClause: string = '';
  private selectFields: string = '*';
  private client: PoolClient | null = null;

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

  // 执行查询
  async then(resolve: (result: { data: any[] | null; error: Error | null; count?: number | null }) => void) {
    try {
      const pool = getPool();
      const { text, values } = this.buildSelectQuery();
      
      const client = this.client || await pool.connect();
      try {
        const result: QueryResult = await client.query(text, values);
        resolve({ data: result.rows, error: null, count: result.rowCount });
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      resolve({ data: null, error: error as Error, count: null });
    }
  }

  // 单条查询
  async single(): Promise<{ data: any | null; error: Error | null; count?: number | null }> {
    this.limitClause = 'LIMIT 1';
    try {
      const pool = getPool();
      const { text, values } = this.buildSelectQuery();
      
      const client = this.client || await pool.connect();
      try {
        const result: QueryResult = await client.query(text, values);
        return { data: result.rows[0] || null, error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // 可能单条
  async maybeSingle(): Promise<{ data: any | null; error: Error | null; count?: number | null }> {
    return this.single();
  }

  // 插入
  async insert(data: any | any[]): Promise<{ data: any | null; error: Error | null; count?: number | null }> {
    try {
      const pool = getPool();
      const dataArray = Array.isArray(data) ? data : [data];
      
      if (dataArray.length === 0) {
        return { data: [], error: null, count: 0 };
      }

      const columns = Object.keys(dataArray[0]);
      const values: any[] = [];
      const placeholders: string[] = [];
      
      dataArray.forEach((row, rowIndex) => {
        const rowPlaceholders = columns.map((col, colIndex) => {
          values.push(row[col]);
          return `$${rowIndex * columns.length + colIndex + 1}`;
        });
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      });

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`;
      
      const client = this.client || await pool.connect();
      try {
        const result: QueryResult = await client.query(sql, values);
        return { data: Array.isArray(data) ? result.rows : result.rows[0], error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // 更新
  async update(data: any): Promise<{ data: any | null; error: Error | null; count?: number | null }> {
    if (this.conditions.length === 0) {
      return { data: null, error: new Error('Update requires at least one condition'), count: null };
    }

    try {
      const pool = getPool();
      const columns = Object.keys(data);
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const values = Object.values(data);
      
      const whereClause = this.conditions.map((c, i) => {
        // 调整参数索引
        return c.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + values.length}`);
      }).join(' AND ');
      
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
      const allValues = [...values, ...this.conditionValues];
      
      const client = this.client || await pool.connect();
      try {
        const result: QueryResult = await client.query(sql, allValues);
        return { data: result.rows, error: null, count: result.rowCount };
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
  async upsert(data: any, options?: { onConflict?: string }): Promise<{ data: any | null; error: Error | null; count?: number | null }> {
    try {
      const pool = getPool();
      const columns = Object.keys(data);
      const placeholders = columns.map((col, i) => `$${i + 1}`).join(', ');
      const values = Object.values(data);
      
      // 支持自定义冲突字段，默认为 'id'
      // 支持复合字段如 'role_id,permission_id'
      const conflictColumns = options?.onConflict || 'id';
      
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
        const result: QueryResult = await client.query(sql, values);
        return { data: result.rows[0], error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
  }

  // 删除
  async delete(): Promise<{ data: any | null; error: Error | null; count?: number | null }> {
    if (this.conditions.length === 0) {
      return { data: null, error: new Error('Delete requires at least one condition'), count: null };
    }

    try {
      const pool = getPool();
      const sql = `DELETE FROM ${this.tableName} WHERE ${this.conditions.join(' AND ')} RETURNING *`;
      
      const client = this.client || await pool.connect();
      try {
        const result: QueryResult = await client.query(sql, this.conditionValues);
        return { data: result.rows, error: null, count: result.rowCount };
      } finally {
        if (!this.client) {
          (client as PoolClient).release();
        }
      }
    } catch (error) {
      return { data: null, error: error as Error, count: null };
    }
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
  rpc(fnName: string, params?: any) {
    // 简单实现，可以扩展
    return {
      async then(resolve: (result: { data: any | null; error: Error | null }) => void) {
        try {
          const pool = getPool();
          const client = await pool.connect();
          try {
            const result = await client.query(`SELECT * FROM ${fnName}($1)`, [params]);
            resolve({ data: result.rows, error: null });
          } finally {
            client.release();
          }
        } catch (error) {
          resolve({ data: null, error: error as Error });
        }
      }
    };
  }
}

// 导出单例
let pgClient: PgClient | null = null;

function getPgClient(): PgClient {
  if (!pgClient) {
    pgClient = new PgClient();
  }
  return pgClient;
}

// 检查是否应该使用本地数据库
function shouldUseLocalDatabase(): boolean {
  loadEnv();
  const useLocal = process.env.USE_LOCAL_DATABASE;
  const databaseUrl = process.env.DATABASE_URL;
  
  // 如果设置了 USE_LOCAL_DATABASE=true，使用本地数据库
  // 或者如果 DATABASE_URL 包含 localhost，使用本地数据库
  if (useLocal === 'true') {
    return true;
  }
  
  if (databaseUrl && databaseUrl.includes('localhost')) {
    return true;
  }
  
  return false;
}

export { 
  loadEnv, 
  getPgClient, 
  getPool, 
  PgClient, 
  QueryBuilder,
  shouldUseLocalDatabase 
};
