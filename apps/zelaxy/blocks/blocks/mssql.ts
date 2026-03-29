import { MSSQLIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { MSSQLResponse } from '@/tools/mssql/types'

export const MSSQLBlock: BlockConfig<MSSQLResponse> = {
  type: 'mssql',
  name: 'Microsoft MSSQL',
  description: 'Execute SQL queries and manage files in Microsoft SQL Server',
  longDescription:
    'Connect to Microsoft SQL Server to execute queries, manage data, and perform file operations. Supports secure connections with automatic query parameterization and connection pooling.',
  category: 'tools',
  docsLink: '#',
  bgColor: '#CC2927', // Microsoft SQL Server red
  icon: MSSQLIcon,
  subBlocks: [
    {
      id: 'server',
      title: 'Server',
      type: 'short-input',
      layout: 'half',
      placeholder: 'localhost or server.domain.com',
      required: true,
      description: 'SQL Server hostname or IP address',
    },
    {
      id: 'port',
      title: 'Port',
      type: 'short-input',
      layout: 'half',
      placeholder: '1433',
      value: () => '1433',
      description: 'SQL Server port (default: 1433)',
    },
    {
      id: 'database',
      title: 'Database',
      type: 'short-input',
      layout: 'half',
      placeholder: 'MyDatabase',
      required: true,
      description: 'Target database name',
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'sa or domain\\user',
      required: true,
      description: 'Database username',
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter password',
      password: true,
      required: true,
      description: 'Database password',
    },
    {
      id: 'encrypt',
      title: 'Enable SSL Encryption',
      type: 'switch',
      layout: 'half',
      description: 'Use SSL/TLS encryption for connection',
    },
    {
      id: 'trustServerCertificate',
      title: 'Trust Server Certificate',
      type: 'switch',
      layout: 'half',
      description: 'Trust self-signed certificates',
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
        { label: '📄 Create File', id: 'create_file' },
        { label: '🗂️ Get File', id: 'get_file' },
        { label: '✏️ Edit File', id: 'edit_file' },
        { label: '🗑️ Delete File', id: 'delete_file' },
        { label: '📁 List Files', id: 'list_files' },
      ],
      value: () => 'execute',
    },
    // Database operation fields
    {
      id: 'query',
      title: 'SQL Query',
      type: 'code',
      layout: 'full',
      placeholder: 'SELECT * FROM Users WHERE active = 1',
      condition: { field: 'action', value: 'execute' },
      required: true,
      wandConfig: {
        enabled: true,
        prompt: `Generate a Microsoft SQL Server query based on the user's request.

Rules:
- Use proper T-SQL syntax (Microsoft SQL Server)
- Use square brackets [TableName] for table/column names with spaces or special characters
- Use parameterized queries when possible (@param1, @param2)
- Include proper JOINs, WHERE clauses, and ORDER BY as needed
- For SELECT queries, specify meaningful column names
- Use appropriate data types (NVARCHAR, INT, DATETIME2, etc.)
- Include error handling with TRY-CATCH blocks when appropriate

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
      placeholder: 'Users, Products, Orders...',
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
        prompt: `Generate JSON data for the database operation based on the user's request.

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
      placeholder: '{"id": 123} or {"status": "active", "created_date": "2024-01-01"}',
      condition: {
        field: 'action',
        value: ['update', 'delete'],
      },
      required: true,
      description: 'JSON object defining WHERE conditions',
    },
    // File operation fields
    {
      id: 'filePath',
      title: 'File Path',
      type: 'short-input',
      layout: 'full',
      placeholder: 'scripts/backup.sql, config/database.json...',
      condition: {
        field: 'action',
        value: ['create_file', 'get_file', 'edit_file', 'delete_file'],
      },
      required: true,
    },
    {
      id: 'content',
      title: 'File Content',
      type: 'code',
      layout: 'full',
      placeholder: 'File content here...',
      condition: {
        field: 'action',
        value: ['create_file', 'edit_file'],
      },
      required: true,
      rows: 8,
    },
    {
      id: 'folderPath',
      title: 'Folder Path',
      type: 'short-input',
      layout: 'full',
      placeholder: 'scripts/, config/ (leave empty for root)',
      condition: { field: 'action', value: 'list_files' },
      description: 'Folder to list files from (optional)',
    },
  ],
  tools: {
    access: ['mssql_database'],
  },
  inputs: {
    server: { type: 'string', description: 'SQL Server hostname or IP' },
    port: { type: 'number', description: 'SQL Server port' },
    database: { type: 'string', description: 'Database name' },
    username: { type: 'string', description: 'Database username' },
    password: { type: 'string', description: 'Database password' },
    encrypt: { type: 'boolean', description: 'Enable SSL encryption' },
    trustServerCertificate: { type: 'boolean', description: 'Trust server certificate' },
    action: { type: 'string', description: 'Operation to perform' },
    query: { type: 'string', description: 'SQL query to execute' },
    table: { type: 'string', description: 'Table name for operations' },
    data: { type: 'json', description: 'Data for insert/update operations' },
    conditions: { type: 'json', description: 'WHERE conditions for update/delete' },
    filePath: { type: 'string', description: 'File path for file operations' },
    content: { type: 'string', description: 'File content' },
    folderPath: { type: 'string', description: 'Folder path for listing files' },
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
    fileName: {
      type: 'string',
      description: 'Name of the file for file operations',
    },
    filePath: {
      type: 'string',
      description: 'Full path of the file',
    },
    content: {
      type: 'string',
      description: 'File content for get/edit operations',
    },
    files: {
      type: 'json',
      description: 'List of files and folders for list operations',
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
