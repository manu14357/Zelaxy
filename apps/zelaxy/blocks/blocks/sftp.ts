import { SftpIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { SftpResponse } from '@/tools/sftp/types'

export const SftpBlock: BlockConfig<SftpResponse> = {
  type: 'sftp',
  name: 'SFTP',
  description: 'Transfer and manage files on an SFTP server',
  longDescription:
    'Connect to any SFTP (SSH File Transfer Protocol) server to list directories, download and upload files, delete files, and create directories. Supports password and private-key authentication. Runs over the node SFTP client on the server — no OAuth required, just your SSH credentials.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1E293B',
  icon: SftpIcon,
  subBlocks: [
    // ── Connection ──
    {
      id: 'host',
      title: 'Host',
      type: 'short-input',
      layout: 'half',
      placeholder: 'sftp.example.com',
      required: true,
      description: 'SFTP server hostname or IP address',
    },
    {
      id: 'port',
      title: 'Port',
      type: 'short-input',
      layout: 'half',
      placeholder: '22',
      value: () => '22',
      description: 'SFTP port (default: 22)',
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'user',
      required: true,
      description: 'SSH username',
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'half',
      placeholder: 'SSH password (or use a private key)',
      password: true,
      description: 'SSH password. Leave empty if using a private key',
    },
    {
      id: 'privateKey',
      title: 'Private Key',
      type: 'long-input',
      layout: 'full',
      placeholder: '-----BEGIN OPENSSH PRIVATE KEY-----\n...',
      password: true,
      mode: 'advanced',
      description: 'PEM-encoded SSH private key. Leave empty if using a password',
    },
    {
      id: 'passphrase',
      title: 'Key Passphrase',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Passphrase for the private key (if any)',
      password: true,
      mode: 'advanced',
      description: 'Passphrase protecting the private key, if it is encrypted',
    },
    // ── Operation ──
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      required: true,
      options: [
        { label: '📁 List Directory', id: 'list' },
        { label: '⬇️ Download File', id: 'get' },
        { label: '⬆️ Upload File', id: 'put' },
        { label: '🗑️ Delete File', id: 'delete' },
        { label: '➕ Make Directory', id: 'mkdir' },
      ],
      value: () => 'list',
    },
    {
      id: 'path',
      title: 'Remote Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/home/user/uploads',
      required: true,
      description: 'Remote file or directory path on the SFTP server',
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'File content to upload...',
      condition: { field: 'operation', value: 'put' },
      required: true,
      description: 'Content to write to the remote file',
    },
    {
      id: 'encoding',
      title: 'Encoding',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'UTF-8 (text)', id: 'utf8' },
        { label: 'Base64 (binary)', id: 'base64' },
      ],
      value: () => 'utf8',
      condition: { field: 'operation', value: ['get', 'put'] },
      description: 'Content encoding for download/upload',
    },
    {
      id: 'recursive',
      title: 'Create Parents',
      type: 'switch',
      layout: 'half',
      condition: { field: 'operation', value: 'mkdir' },
      description: 'Create parent directories as needed (mkdir -p)',
    },
  ],
  tools: {
    access: ['sftp_list', 'sftp_get', 'sftp_put', 'sftp_delete', 'sftp_mkdir'],
    config: {
      tool: (params) => {
        switch (params.operation) {
          case 'get':
            return 'sftp_get'
          case 'put':
            return 'sftp_put'
          case 'delete':
            return 'sftp_delete'
          case 'mkdir':
            return 'sftp_mkdir'
          default:
            return 'sftp_list'
        }
      },
      params: (params) => {
        const base: Record<string, any> = {
          host: params.host,
          port: params.port ? Number(params.port) : 22,
          username: params.username,
          password: params.password || undefined,
          privateKey: params.privateKey || undefined,
          passphrase: params.passphrase || undefined,
          path: params.path,
        }
        if (params.operation === 'put') {
          base.content = params.content
        }
        if (params.operation === 'get' || params.operation === 'put') {
          base.encoding = params.encoding || 'utf8'
        }
        if (params.operation === 'mkdir') {
          base.recursive = params.recursive !== false
        }
        return base
      },
    },
  },
  inputs: {
    host: { type: 'string', description: 'SFTP server hostname or IP' },
    port: { type: 'number', description: 'SFTP port (default 22)' },
    username: { type: 'string', description: 'SSH username' },
    password: { type: 'string', description: 'SSH password' },
    privateKey: { type: 'string', description: 'PEM-encoded SSH private key' },
    passphrase: { type: 'string', description: 'Passphrase for the private key' },
    operation: { type: 'string', description: 'Operation: list, get, put, delete, mkdir' },
    path: { type: 'string', description: 'Remote file or directory path' },
    content: { type: 'string', description: 'Content to upload (put operation)' },
    encoding: { type: 'string', description: "Content encoding: 'utf8' or 'base64'" },
    recursive: { type: 'boolean', description: 'Create parent directories (mkdir operation)' },
  },
  outputs: {
    path: { type: 'string', description: 'The remote path operated on' },
    files: { type: 'json', description: 'Directory entries (list operation)' },
    count: { type: 'number', description: 'Number of entries returned (list operation)' },
    content: { type: 'string', description: 'Downloaded file contents (get operation)' },
    encoding: { type: 'string', description: 'Encoding of returned content (get operation)' },
    size: { type: 'number', description: 'File size in bytes (get operation)' },
    bytesWritten: { type: 'number', description: 'Bytes written (put operation)' },
    status: { type: 'string', description: 'Result status message' },
    error: { type: 'string', description: 'Error message if the operation failed' },
  },
}
