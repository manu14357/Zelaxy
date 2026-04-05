import pg from 'pg'
import type { PostgreSQLResponse } from './types'
import { sanitizeIdentifier } from './utils'

const { Pool } = pg

export interface PostgreSQLConnectionConfig {
  host: string
  database: string
  user: string
  password?: string
  port?: number
  ssl?: boolean | { rejectUnauthorized: boolean }
}

export class PostgreSQLDatabase {
  private static pools: Map<string, InstanceType<typeof Pool>> = new Map()

  /**
   * Get or create a connection pool for the given configuration
   */
  static async getPool(config: PostgreSQLConnectionConfig): Promise<InstanceType<typeof Pool>> {
    const poolKey = `${config.host}:${config.port || 5432}:${config.database}:${config.user}`

    let pool = PostgreSQLDatabase.pools.get(poolKey)

    if (!pool) {
      pool = new Pool({
        host: config.host,
        database: config.database,
        user: config.user,
        password: config.password,
        port: config.port || 5432,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
        statement_timeout: 30000,
      })

      // Test the connection
      const client = await pool.connect()
      client.release()

      PostgreSQLDatabase.pools.set(poolKey, pool)
    }

    return pool
  }

  /**
   * Execute a raw SQL query
   */
  static async executeQuery(
    config: PostgreSQLConnectionConfig,
    query: string,
    parameters?: any[]
  ): Promise<PostgreSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await PostgreSQLDatabase.getPool(config)
      const result = await pool.query(query, parameters)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: result.rows || [],
          affectedRows: result.rowCount || 0,
          metadata: {
            executionTime,
            rowCount: result.rows?.length || 0,
            columns: result.fields?.map((f) => f.name) || [],
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
    config: PostgreSQLConnectionConfig,
    table: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<PostgreSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await PostgreSQLDatabase.getPool(config)
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
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
        const query = `INSERT INTO "${sanitizedTable}" ("${sanitizedColumns.join('", "')}") VALUES (${placeholders})`

        const result = await pool.query(query, values)
        totalAffected += result.rowCount || 0
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
    config: PostgreSQLConnectionConfig,
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<PostgreSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await PostgreSQLDatabase.getPool(config)

      const sanitizedTable = sanitizeIdentifier(table)
      const dataKeys = Object.keys(data)
      const conditionKeys = Object.keys(conditions)

      const setClause = dataKeys
        .map((key, i) => `"${sanitizeIdentifier(key)}" = $${i + 1}`)
        .join(', ')
      const whereClause = conditionKeys
        .map((key, i) => `"${sanitizeIdentifier(key)}" = $${dataKeys.length + i + 1}`)
        .join(' AND ')

      const query = `UPDATE "${sanitizedTable}" SET ${setClause} WHERE ${whereClause}`
      const values = [...Object.values(data), ...Object.values(conditions)]

      const result = await pool.query(query, values)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: [
            {
              success: true,
              operation: 'UPDATE',
              affectedRows: result.rowCount || 0,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: result.rowCount || 0,
          metadata: {
            executionTime,
            rowCount: result.rowCount || 0,
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
    config: PostgreSQLConnectionConfig,
    table: string,
    conditions: Record<string, any>
  ): Promise<PostgreSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await PostgreSQLDatabase.getPool(config)

      const sanitizedTable = sanitizeIdentifier(table)
      const conditionKeys = Object.keys(conditions)

      const whereClause = conditionKeys
        .map((key, i) => `"${sanitizeIdentifier(key)}" = $${i + 1}`)
        .join(' AND ')
      const query = `DELETE FROM "${sanitizedTable}" WHERE ${whereClause}`
      const values = Object.values(conditions)

      const result = await pool.query(query, values)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: [
            {
              success: true,
              operation: 'DELETE',
              affectedRows: result.rowCount || 0,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: result.rowCount || 0,
          metadata: {
            executionTime,
            rowCount: result.rowCount || 0,
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
  static async testConnection(config: PostgreSQLConnectionConfig): Promise<PostgreSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await PostgreSQLDatabase.getPool(config)
      const result = await pool.query(
        'SELECT 1 as test, NOW() as current_time, version() as version'
      )
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: result.rows,
          metadata: {
            executionTime,
            rowCount: result.rows?.length || 0,
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
  static async closeAllPools(): Promise<void> {
    for (const [key, pool] of PostgreSQLDatabase.pools.entries()) {
      try {
        await pool.end()
        PostgreSQLDatabase.pools.delete(key)
      } catch (error) {
        console.error(`Error closing pool ${key}:`, error)
      }
    }
  }
}
