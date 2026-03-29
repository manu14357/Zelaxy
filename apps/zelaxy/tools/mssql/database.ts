import sql from 'mssql'
import type { MSSQLResponse } from './types'

export interface MSSQLConnectionConfig {
  server: string
  database: string
  user: string
  password: string
  port?: number
  options?: {
    encrypt?: boolean
    trustServerCertificate?: boolean
    enableArithAbort?: boolean
  }
}

export class MSSQLDatabase {
  private static pools: Map<string, sql.ConnectionPool> = new Map()

  /**
   * Get or create a connection pool for the given configuration
   */
  static async getPool(config: MSSQLConnectionConfig): Promise<sql.ConnectionPool> {
    const poolKey = `${config.server}:${config.port || 1433}:${config.database}:${config.user}`

    let pool = MSSQLDatabase.pools.get(poolKey)

    if (!pool) {
      pool = new sql.ConnectionPool({
        server: config.server,
        database: config.database,
        user: config.user,
        password: config.password,
        port: config.port || 1433,
        options: {
          encrypt: config.options?.encrypt ?? true,
          trustServerCertificate: config.options?.trustServerCertificate ?? false,
          enableArithAbort: true,
          ...config.options,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
        requestTimeout: 30000,
        connectionTimeout: 30000,
      })

      await pool.connect()
      MSSQLDatabase.pools.set(poolKey, pool)
    }

    return pool
  }

  /**
   * Execute a raw SQL query
   */
  static async executeQuery(
    config: MSSQLConnectionConfig,
    query: string,
    parameters?: Record<string, any>
  ): Promise<MSSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MSSQLDatabase.getPool(config)
      const request = pool.request()

      // Add parameters if provided
      if (parameters) {
        for (const [key, value] of Object.entries(parameters)) {
          request.input(key, value)
        }
      }

      const result = await request.query(query)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: result.recordset || [],
          affectedRows: result.rowsAffected?.[0] || 0,
          metadata: {
            executionTime,
            rowCount: result.recordset?.length || 0,
            columns: result.recordset?.columns ? Object.keys(result.recordset.columns) : [],
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Put error details in the data field for consistent access via {{blockName.data}}
      return {
        success: true, // Changed to true so workflow continues
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
    config: MSSQLConnectionConfig,
    table: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<MSSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MSSQLDatabase.getPool(config)
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

      const columns = Object.keys(dataArray[0])
      const placeholders = columns.map((_, index) => `@param${index}`).join(', ')
      const query = `INSERT INTO [${table}] ([${columns.join('], [')}]) VALUES (${placeholders})`

      let totalAffected = 0

      for (const row of dataArray) {
        const request = pool.request()

        columns.forEach((col, index) => {
          request.input(`param${index}`, row[col])
        })

        const result = await request.query(query)
        totalAffected += result.rowsAffected?.[0] || 0
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
        success: true, // Changed to true so workflow continues
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
    config: MSSQLConnectionConfig,
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<MSSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MSSQLDatabase.getPool(config)
      const request = pool.request()

      const setClause = Object.keys(data)
        .map((key, index) => `[${key}] = @set${index}`)
        .join(', ')
      const whereClause = Object.keys(conditions)
        .map((key, index) => `[${key}] = @where${index}`)
        .join(' AND ')

      const query = `UPDATE [${table}] SET ${setClause} WHERE ${whereClause}`

      // Add SET parameters
      Object.entries(data).forEach(([key, value], index) => {
        request.input(`set${index}`, value)
      })

      // Add WHERE parameters
      Object.entries(conditions).forEach(([key, value], index) => {
        request.input(`where${index}`, value)
      })

      const result = await request.query(query)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: [
            {
              success: true,
              operation: 'UPDATE',
              affectedRows: result.rowsAffected?.[0] || 0,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: result.rowsAffected?.[0] || 0,
          metadata: {
            executionTime,
            rowCount: result.rowsAffected?.[0] || 0,
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true, // Changed to true so workflow continues
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
    config: MSSQLConnectionConfig,
    table: string,
    conditions: Record<string, any>
  ): Promise<MSSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MSSQLDatabase.getPool(config)
      const request = pool.request()

      const whereClause = Object.keys(conditions)
        .map((key, index) => `[${key}] = @param${index}`)
        .join(' AND ')
      const query = `DELETE FROM [${table}] WHERE ${whereClause}`

      // Add WHERE parameters
      Object.entries(conditions).forEach(([key, value], index) => {
        request.input(`param${index}`, value)
      })

      const result = await request.query(query)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: [
            {
              success: true,
              operation: 'DELETE',
              affectedRows: result.rowsAffected?.[0] || 0,
              executionTime,
              timestamp: new Date().toISOString(),
            },
          ],
          affectedRows: result.rowsAffected?.[0] || 0,
          metadata: {
            executionTime,
            rowCount: result.rowsAffected?.[0] || 0,
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true, // Changed to true so workflow continues
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
  static async testConnection(config: MSSQLConnectionConfig): Promise<MSSQLResponse> {
    const startTime = Date.now()

    try {
      const pool = await MSSQLDatabase.getPool(config)
      const request = pool.request()
      const result = await request.query(
        'SELECT 1 as test, GETDATE() as current_time, @@VERSION as version'
      )

      const executionTime = Date.now() - startTime

      return {
        success: true,
        output: {
          data: result.recordset,
          metadata: {
            executionTime,
            rowCount: result.recordset?.length || 0,
          },
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: true, // Changed to true so workflow continues
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
    for (const [key, pool] of MSSQLDatabase.pools.entries()) {
      try {
        await pool.close()
        MSSQLDatabase.pools.delete(key)
      } catch (error) {
        console.error(`Error closing pool ${key}:`, error)
      }
    }
  }
}
