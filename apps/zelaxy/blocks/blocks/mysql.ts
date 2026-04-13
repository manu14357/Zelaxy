import { MySQLIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { MySQLResponse } from '@/tools/mysql/types'

export const MySQLBlock: BlockConfig<MySQLResponse> = {
  type: 'mysql',
  name: 'MySQL',
  description: 'Execute SQL queries and manage data in MySQL databases',
  longDescription:
    'Connect to MySQL to execute queries, manage data with full CRUD operations. Supports secure SSL connections, parameterized queries, and connection pooling.',
  category: 'tools',
  docsLink: '#',
  bgColor: '#FFFFFF',
  icon: MySQLIcon,
  subBlocks: [
    {
      id: 'host',
      title: 'Host',
      type: 'short-input',
      layout: 'half',
      placeholder: 'localhost or db.example.com',
      required: true,
      description: 'MySQL hostname or IP address',
    },
    {
      id: 'port',
      title: 'Port',
      type: 'short-input',
      layout: 'half',
      placeholder: '3306',
      value: () => '3306',
      description: 'MySQL port (default: 3306)',
    },
    {
      id: 'database',
      title: 'Database',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my_database',
      required: true,
      description: 'Target database name',
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'root',
      required: true,
      description: 'Database username',
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter password (optional for local auth)',
      password: true,
      description: 'Database password (leave empty for passwordless auth)',
    },
    {
      id: 'ssl',
      title: 'Enable SSL',
      type: 'switch',
      layout: 'full',
      description: 'Use SSL/TLS encryption for connection',
    },
    {
      id: 'action',
      title: 'Action',
      type: 'dropdown',
      layout: 'full',
      required: true,
      options: [
        { label: '🔍 Execute Query', id: 'execute' },
        { label: '➕ Insert Data', id: 'insert' },
        { label: '✏️ Update Data', id: 'update' },
        { label: '🗑️ Delete Data', id: 'delete' },
      ],
      value: () => 'execute',
    },
    {
      id: 'query',
      title: 'SQL Query',
      type: 'code',
      layout: 'full',
      placeholder: 'SELECT * FROM users WHERE active = 1',
      condition: { field: 'action', value: 'execute' },
      required: true,
      wandConfig: {
        enabled: true,
        prompt: `Generate a MySQL query based on the user's request.

Rules:
- Use proper MySQL syntax
- Use backticks \`table_name\` for identifiers with special characters
- Use prepared statement placeholders (?) when possible
- Include proper JOINs, WHERE clauses, and ORDER BY as needed
- For SELECT queries, specify meaningful column names
- Use appropriate MySQL data types (VARCHAR, INT, DATETIME, JSON, etc.)
- Use MySQL-specific features where beneficial (CTEs, window functions, LAST_INSERT_ID(), etc.)

You have access to the following variables:
- Previous block outputs: {{blockName.output.fieldName}} (e.g., {{agent2.content}} or {{start.input}})
- Workflow variables: {{variable.variableName}} (e.g., {{variable.userId}})
- Environment variables: {{ENV_VAR_NAME}}

Current query: {context}

Generate only the SQL query without explanations.`,
        generationType: 'custom-tool-schema',
        placeholder: 'Describe the SQL query you need...',
      },
    },
    {
      id: 'table',
      title: 'Table Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'users, products, orders...',
      condition: {
        field: 'action',
        value: ['insert', 'update', 'delete'],
      },
      required: true,
    },
    {
      id: 'data',
      title: 'Data',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{"name": "John Doe", "email": "john@example.com", "active": true}',
      condition: {
        field: 'action',
        value: ['insert', 'update'],
      },
      required: true,
      wandConfig: {
        enabled: true,
        prompt: `Generate JSON data for the MySQL operation based on the user's request.

For INSERT operations:
- Create an object or array of objects with the data to insert
- Use appropriate data types (strings, numbers, booleans, dates)
- Include all required fields for the table

For UPDATE operations:
- Create an object with only the fields to update
- Use proper data types

You can reference other block outputs like {{agent2.content}} or workflow variables like {{variable.userId}}.

Current data: {context}

Generate only valid JSON without explanations.`,
        generationType: 'json-object',
        placeholder: 'Describe the data to insert/update...',
      },
    },
    {
      id: 'conditions',
      title: 'Conditions (WHERE clause)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{"id": 123} or {"status": "active", "created_at": "2024-01-01"}',
      condition: {
        field: 'action',
        value: ['update', 'delete'],
      },
      required: true,
      description: 'JSON object defining WHERE conditions',
    },
  ],
  tools: {
    access: ['mysql_database'],
  },
  inputs: {
    host: { type: 'string', description: 'MySQL hostname or IP' },
    port: { type: 'number', description: 'MySQL port' },
    database: { type: 'string', description: 'Database name' },
    username: { type: 'string', description: 'Database username' },
    password: { type: 'string', description: 'Database password' },
    ssl: { type: 'boolean', description: 'Enable SSL connection' },
    action: { type: 'string', description: 'Operation to perform' },
    query: { type: 'string', description: 'SQL query to execute' },
    table: { type: 'string', description: 'Table name for operations' },
    data: { type: 'json', description: 'Data for insert/update operations' },
    conditions: { type: 'json', description: 'WHERE conditions for update/delete' },
  },
  outputs: {
    data: {
      type: 'json',
      description: 'Query results for SELECT operations',
    },
    affectedRows: {
      type: 'number',
      description: 'Number of rows affected by INSERT/UPDATE/DELETE operations',
    },
    metadata: {
      type: 'json',
      description: 'Query execution metadata including timing and row counts',
    },
    error: {
      type: 'string',
      description: 'Error message if operation fails',
    },
    errorDetails: {
      type: 'json',
      description: 'Detailed error information including type and execution time',
    },
  },
}
