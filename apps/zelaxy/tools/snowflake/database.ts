import type {
  SnowflakeConnectionParams,
  SnowflakeConnectionPool,
  SnowflakeMetrics,
  SnowflakeQueryResult,
} from './types'

/**
 * Snowflake Database Connection Manager
 * Handles connection pooling, query execution, and connection lifecycle
 */
export class SnowflakeDatabase {
  private static connectionPools = new Map<string, SnowflakeConnectionPool>()
  private static metrics = new Map<string, SnowflakeMetrics>()
  private connectionParams: SnowflakeConnectionParams
  private connectionKey: string

  constructor(params: SnowflakeConnectionParams) {
    this.connectionParams = params
    this.connectionKey = this.generateConnectionKey()
  }

  /**
   * Generate a unique key for connection pooling
   */
  private generateConnectionKey(): string {
    return `${this.connectionParams.accountName}_${this.connectionParams.database}_${this.connectionParams.warehouse}_${this.connectionParams.schema}_${this.connectionParams.username}`
  }

  /**
   * Create Snowflake SDK connection configuration
   */
  private createConfig() {
    const config: any = {
      account: this.connectionParams.accountName,
      database: this.connectionParams.database,
      warehouse: this.connectionParams.warehouse,
      schema: this.connectionParams.schema,
      application: 'zelaxy-snowflake-connector',
      connectTimeout: (this.connectionParams.connectionTimeout || 60) * 1000,
      networkTimeout: (this.connectionParams.queryTimeout || 300) * 1000,
      clientSessionKeepAlive: this.connectionParams.clientSessionKeepAlive || false,
    }

    // Add role if specified
    if (this.connectionParams.role) {
      config.role = this.connectionParams.role
    }

    // Configure authentication
    switch (this.connectionParams.connectionMode) {
      case 'credentials':
        config.username = this.connectionParams.username
        config.password = this.connectionParams.password
        break

      case 'oauth':
        config.token = this.connectionParams.oauthToken
        break

      case 'keypair':
        config.username = this.connectionParams.username
        config.privateKey = this.connectionParams.privateKey
        if (this.connectionParams.privateKeyPassphrase) {
          config.privateKeyPassphrase = this.connectionParams.privateKeyPassphrase
        }
        config.authenticator = 'SNOWFLAKE_JWT'
        break

      default:
        throw new Error(`Unsupported connection mode: ${this.connectionParams.connectionMode}`)
    }

    return config
  }

  /**
   * Test the database connection
   */
  async testConnection(): Promise<SnowflakeQueryResult> {
    try {
      const result = await this.execute(
        'SELECT CURRENT_VERSION() as version, CURRENT_USER() as user'
      )
      return {
        success: true,
        data: result.rows,
        connectionInfo: {
          version: result.rows[0]?.VERSION,
          user: result.rows[0]?.USER,
          account: this.connectionParams.accountName,
          database: this.connectionParams.database,
          warehouse: this.connectionParams.warehouse,
          schema: this.connectionParams.schema,
          connected: true,
        },
        executionTime: result.executionTime,
        queryId: result.queryId,
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        connectionInfo: { connected: false },
      }
    }
  }

  /**
   * Get or create a connection from the pool
   */
  private async getConnection(): Promise<any> {
    // Check if connection pooling is enabled
    const enablePooling = this.connectionParams.enableConnectionPooling

    if (enablePooling) {
      const pool = SnowflakeDatabase.connectionPools.get(this.connectionKey)
      if (pool && pool.connections.size > 0) {
        // Get an existing connection
        for (const [id, connection] of pool.connections) {
          if (connection?.isValidAsync) {
            const isValid = await connection.isValidAsync()
            if (isValid) {
              return connection
            }
            pool.connections.delete(id)
            pool.activeConnections--
          }
        }
      }
    }

    // Create new connection
    const snowflake = require('snowflake-sdk')
    const config = this.createConfig()

    return new Promise((resolve, reject) => {
      snowflake.createConnection(config).connect((err: any, conn: any) => {
        if (err) {
          reject(new Error(`Failed to connect to Snowflake: ${err.message}`))
          return
        }

        if (enablePooling) {
          this.addToPool(conn)
        }

        resolve(conn)
      })
    })
  }

  /**
   * Add connection to the pool
   */
  private addToPool(connection: any): void {
    const maxConnections = this.connectionParams.maxConnections || 10

    let pool = SnowflakeDatabase.connectionPools.get(this.connectionKey)
    if (!pool) {
      pool = {
        connections: new Map(),
        maxConnections,
        activeConnections: 0,
      }
      SnowflakeDatabase.connectionPools.set(this.connectionKey, pool)
    }

    if (pool.activeConnections < maxConnections) {
      const connectionId = `conn_${Date.now()}_${Math.random()}`
      pool.connections.set(connectionId, connection)
      pool.activeConnections++

      // Auto-cleanup after 5 minutes of inactivity
      setTimeout(
        () => {
          if (pool.connections.has(connectionId)) {
            connection.destroy(() => {})
            pool.connections.delete(connectionId)
            pool.activeConnections--
          }
        },
        5 * 60 * 1000
      )
    }
  }

  /**
   * Execute a SQL query
   */
  async execute(query: string, binds?: any[], options?: { streaming?: boolean }): Promise<any> {
    const startTime = new Date()
    const connection = await this.getConnection()

    return new Promise((resolve, reject) => {
      const executeOptions: any = {
        sqlText: query,
        complete: (err: any, stmt: any, rows: any) => {
          const endTime = new Date()
          const executionTime = endTime.getTime() - startTime.getTime()

          // Update metrics
          this.updateMetrics(executionTime, !err)

          if (err) {
            // Close connection if not pooled
            if (!this.connectionParams.enableConnectionPooling) {
              connection.destroy(() => {})
            }
            reject(new Error(`Query execution failed: ${err.message}`))
            return
          }

          // Close connection if not pooled
          if (!this.connectionParams.enableConnectionPooling) {
            connection.destroy(() => {})
          }

          resolve({
            rows: rows || [],
            statement: stmt,
            executionTime,
            queryId: stmt.getStatementId(),
            success: true,
          })
        },
      }

      // Add parameter binds if provided
      if (binds && binds.length > 0) {
        executeOptions.binds = binds
      }

      // Configure streaming if requested
      if (options?.streaming) {
        executeOptions.streamResult = true
      }

      connection.execute(executeOptions)
    })
  }

  /**
   * Execute multiple queries in a transaction
   */
  async executeTransaction(queries: string[]): Promise<any[]> {
    const connection = await this.getConnection()
    const results: any[] = []

    try {
      // Begin transaction
      await this.executeOnConnection(connection, 'BEGIN')

      // Execute all queries
      for (const query of queries) {
        const result = await this.executeOnConnection(connection, query)
        results.push(result)
      }

      // Commit transaction
      await this.executeOnConnection(connection, 'COMMIT')

      return results
    } catch (error) {
      // Rollback on error
      try {
        await this.executeOnConnection(connection, 'ROLLBACK')
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError)
      }
      throw error
    } finally {
      // Close connection if not pooled
      if (!this.connectionParams.enableConnectionPooling) {
        connection.destroy(() => {})
      }
    }
  }

  /**
   * Execute query on specific connection (for transactions)
   */
  private executeOnConnection(connection: any, query: string, binds?: any[]): Promise<any> {
    const startTime = new Date()

    return new Promise((resolve, reject) => {
      const executeOptions: any = {
        sqlText: query,
        complete: (err: any, stmt: any, rows: any) => {
          const endTime = new Date()
          const executionTime = endTime.getTime() - startTime.getTime()

          if (err) {
            reject(new Error(`Query execution failed: ${err.message}`))
            return
          }

          resolve({
            rows: rows || [],
            statement: stmt,
            executionTime,
            queryId: stmt.getStatementId(),
          })
        },
      }

      if (binds && binds.length > 0) {
        executeOptions.binds = binds
      }

      connection.execute(executeOptions)
    })
  }

  /**
   * Update connection metrics
   */
  private updateMetrics(executionTime: number, success: boolean): void {
    let metrics = SnowflakeDatabase.metrics.get(this.connectionKey)
    if (!metrics) {
      metrics = {
        queryCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        errorCount: 0,
        connectionCount: 0,
      }
      SnowflakeDatabase.metrics.set(this.connectionKey, metrics)
    }

    metrics.queryCount++
    metrics.totalExecutionTime += executionTime
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.queryCount
    metrics.lastQueryTime = new Date()

    if (!success) {
      metrics.errorCount++
    }
  }

  /**
   * Get connection metrics
   */
  getMetrics(): SnowflakeMetrics | undefined {
    return SnowflakeDatabase.metrics.get(this.connectionKey)
  }

  /**
   * Close all connections in the pool
   */
  static async closeAllConnections(): Promise<void> {
    for (const [key, pool] of SnowflakeDatabase.connectionPools) {
      for (const [id, connection] of pool.connections) {
        try {
          connection.destroy(() => {})
        } catch (error) {
          console.error(`Error closing connection ${id}:`, error)
        }
      }
      pool.connections.clear()
      pool.activeConnections = 0
    }
    SnowflakeDatabase.connectionPools.clear()
  }

  /**
   * Get warehouse information
   */
  async getWarehouseInfo(): Promise<any> {
    const query = `
      SELECT 
        NAME,
        STATE,
        TYPE,
        SIZE,
        RUNNING,
        QUEUED,
        AUTO_SUSPEND,
        AUTO_RESUME,
        COMMENT
      FROM INFORMATION_SCHEMA.WAREHOUSES 
      WHERE NAME = '${this.connectionParams.warehouse}'
    `

    const result = await this.execute(query)
    return result.rows[0] || null
  }

  /**
   * Get database schema information
   */
  async getDatabaseSchema(): Promise<any> {
    const query = `
      SELECT 
        SCHEMA_NAME,
        COMMENT,
        IS_TRANSIENT,
        IS_MANAGED_ACCESS
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = '${this.connectionParams.schema}'
    `

    const result = await this.execute(query)
    return result.rows[0] || null
  }

  /**
   * List all tables in the current schema
   */
  async listTables(): Promise<any[]> {
    const query = `
      SELECT 
        TABLE_NAME,
        TABLE_TYPE,
        IS_TRANSIENT,
        CLUSTERING_KEY,
        ROW_COUNT,
        BYTES,
        RETENTION_TIME,
        COMMENT
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${this.connectionParams.schema}'
      ORDER BY TABLE_NAME
    `

    const result = await this.execute(query)
    return result.rows
  }

  /**
   * Get table column information
   */
  async getTableColumns(tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        COLUMN_NAME,
        ORDINAL_POSITION,
        IS_NULLABLE,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE,
        COLUMN_DEFAULT,
        IS_IDENTITY,
        COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${this.connectionParams.schema}' 
      AND TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `

    const result = await this.execute(query)
    return result.rows
  }
}
