import mysql from 'mysql2/promise'
import type { MySQLResponse } from './types'
import { sanitizeIdentifier } from './utils'

export interface MySQLConnectionConfig {
  host: string
  database: string
  user: string
  password?: string
  port?: number
  ssl?: boolean
}

export class MySQLDatabase {
  private static pools: Map<string, mysql.Pool> = new Map()

  /**
   * Get or create a connection pool for the given configuration
   */
  static async getPool(config: MySQLConnectionConfig): Promise<mysql.Pool> {
    const poolKey = `${config.host}:${config.port || 3306}:${config.database}:${config.user}`

    let pool = MySQLDatabase.pools.get(poolKey)

    if (!pool) {
      pool = mysql.createPool({
        host: config.host,
        database: config.database,
        user: config.user,
        password: config.password || '',
        port: config.port || 3306,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        connectionLimit: 10,
        waitForConnections: true,
        connectTimeout: 30000,
        idleTimeout: 30000,
      })

      // Test the connection
      const connection = await pool.getConnection()
      connection.release()

      MySQLDatabase.pools.set(poolKey, pool)
    }

    return pool
  }

  /**
   * Execute a raw SQL query
   */
  static async executeQuery(
    config: MySQLConnectionConfig,
    query: string,
    parameters?: any[]
  ): Promise<MySQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MySQLDatabase.getPool(config)
      const [rows, fields] = await pool.execute(query, parameters)
      const executionTime = Date.now() - startTime

      const isResultSet = Array.isArray(rows)
      const resultRows = isResultSet ? (rows as any[]) : []
      const affectedRows = isResultSet ? resultRows.length : (rows as any).affectedRows || 0

      return {
        success: true,
        output: {
          data: resultRows,
          affectedRows,
          metadata: {
            executionTime,
            rowCount: resultRows.length,
            columns: Array.isArray(fields) ? (fields as any[]).map((f: any) => f.name) : [],
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true,
        output: {
          data: [
            {
              error: true,
              errorType: 'SQL_ERROR',
              message: errorMessage,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: 0,
          metadata: {
            executionTime,
            rowCount: 0,
            columns: [],
          },
        },
      }
    }
  }

  /**
   * Insert data into a table
   */
  static async insertData(
    config: MySQLConnectionConfig,
    table: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<MySQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MySQLDatabase.getPool(config)
      const dataArray = Array.isArray(data) ? data : [data]

      if (dataArray.length === 0) {
        return {
          success: true,
          output: {
            data: [
              {
                error: true,
                errorType: 'VALIDATION_ERROR',
                message: 'No data provided for insert operation',
                timestamp: new Date().toISOString(),
              },
            ],
            affectedRows: 0,
            metadata: {
              executionTime: Date.now() - startTime,
              rowCount: 0,
            },
          },
        }
      }

      const sanitizedTable = sanitizeIdentifier(table)
      const columns = Object.keys(dataArray[0])
      const sanitizedColumns = columns.map(sanitizeIdentifier)

      let totalAffected = 0

      for (const row of dataArray) {
        const values = columns.map((col) => row[col])
        const placeholders = columns.map(() => '?').join(', ')
        const query = `INSERT INTO \`${sanitizedTable}\` (\`${sanitizedColumns.join('`, `')}\`) VALUES (${placeholders})`

        const [result] = await pool.execute(query, values)
        totalAffected += (result as any).affectedRows || 0
      }

      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: [
            {
              success: true,
              operation: 'INSERT',
              affectedRows: totalAffected,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: totalAffected,
          metadata: {
            executionTime,
            rowCount: totalAffected,
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true,
        output: {
          data: [
            {
              error: true,
              errorType: 'INSERT_ERROR',
              message: errorMessage,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: 0,
          metadata: {
            executionTime,
            rowCount: 0,
          },
        },
      }
    }
  }

  /**
   * Update data in a table
   */
  static async updateData(
    config: MySQLConnectionConfig,
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<MySQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MySQLDatabase.getPool(config)

      const sanitizedTable = sanitizeIdentifier(table)
      const dataKeys = Object.keys(data)
      const conditionKeys = Object.keys(conditions)

      const setClause = dataKeys.map((key) => `\`${sanitizeIdentifier(key)}\` = ?`).join(', ')
      const whereClause = conditionKeys
        .map((key) => `\`${sanitizeIdentifier(key)}\` = ?`)
        .join(' AND ')

      const query = `UPDATE \`${sanitizedTable}\` SET ${setClause} WHERE ${whereClause}`
      const values = [...Object.values(data), ...Object.values(conditions)]

      const [result] = await pool.execute(query, values)
      const executionTime = Date.now() - startTime
      const affectedRows = (result as any).affectedRows || 0

      return {
        success: true,
        output: {
          data: [
            {
              success: true,
              operation: 'UPDATE',
              affectedRows,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows,
          metadata: {
            executionTime,
            rowCount: affectedRows,
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true,
        output: {
          data: [
            {
              error: true,
              errorType: 'UPDATE_ERROR',
              message: errorMessage,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: 0,
          metadata: {
            executionTime,
            rowCount: 0,
          },
        },
      }
    }
  }

  /**
   * Delete data from a table
   */
  static async deleteData(
    config: MySQLConnectionConfig,
    table: string,
    conditions: Record<string, any>
  ): Promise<MySQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MySQLDatabase.getPool(config)

      const sanitizedTable = sanitizeIdentifier(table)
      const conditionKeys = Object.keys(conditions)

      const whereClause = conditionKeys
        .map((key) => `\`${sanitizeIdentifier(key)}\` = ?`)
        .join(' AND ')
      const query = `DELETE FROM \`${sanitizedTable}\` WHERE ${whereClause}`
      const values = Object.values(conditions)

      const [result] = await pool.execute(query, values)
      const executionTime = Date.now() - startTime
      const affectedRows = (result as any).affectedRows || 0

      return {
        success: true,
        output: {
          data: [
            {
              success: true,
              operation: 'DELETE',
              affectedRows,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows,
          metadata: {
            executionTime,
            rowCount: affectedRows,
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true,
        output: {
          data: [
            {
              error: true,
              errorType: 'DELETE_ERROR',
              message: errorMessage,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: 0,
          metadata: {
            executionTime,
            rowCount: 0,
          },
        },
      }
    }
  }

  /**
   * Test database connection
   */
  static async testConnection(config: MySQLConnectionConfig): Promise<MySQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MySQLDatabase.getPool(config)
      const [rows] = await pool.execute(
        'SELECT 1 as test, NOW() as current_time, VERSION() as version'
      )
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: rows as any[],
          metadata: {
            executionTime,
            rowCount: (rows as any[])?.length || 0,
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true,
        output: {
          data: [
            {
              error: true,
              errorType: 'CONNECTION_ERROR',
              message: errorMessage,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: 0,
          metadata: {
            executionTime,
            rowCount: 0,
          },
        },
      }
    }
  }

  /**
   * Close all connection pools
   */
  static async closeAll(): Promise<void> {
    for (const [key, pool] of MySQLDatabase.pools.entries()) {
      await pool.end()
      MySQLDatabase.pools.delete(key)
    }
  }
}
