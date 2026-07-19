import { SshIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { SshResponse } from '@/tools/ssh/types'

const FILE_OPS = [
  'read_file',
  'write_file',
  'append_file',
  'delete_file',
  'rename',
  'file_stat',
  'change_permissions',
  'list_directory',
  'create_directory',
  'remove_directory',
  'check_exists',
]

export const SshBlock: BlockConfig<SshResponse> = {
  type: 'ssh',
  name: 'SSH',
  description: 'Run commands and transfer files on remote hosts over SSH/SFTP',
  longDescription:
    'Connect to remote servers over SSH to execute commands and scripts, and manage files and directories over SFTP. Supports password and private-key authentication and 13 operations including reading, writing, listing, renaming, permission changes, and existence checks.',
  category: 'tools',
  docsLink: 'https://docs.zelaxy.ai/tools/ssh',
  bgColor: '#1E1E2E',
  icon: SshIcon,
  subBlocks: [
    {
      id: 'host',
      title: 'Host',
      type: 'short-input',
      layout: 'half',
      placeholder: 'example.com or 10.0.0.5',
      required: true,
      description: 'SSH server hostname or IP address',
    },
    {
      id: 'port',
      title: 'Port',
      type: 'short-input',
      layout: 'half',
      placeholder: '22',
      value: () => '22',
      description: 'SSH port (default: 22)',
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'root',
      required: true,
      description: 'SSH username',
    },
    {
      id: 'authType',
      title: 'Authentication',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Password', id: 'password' },
        { label: 'Private Key', id: 'privateKey' },
      ],
      value: () => 'password',
      description: 'How to authenticate with the SSH server',
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter SSH password',
      password: true,
      condition: { field: 'authType', value: 'password' },
      description: 'SSH password',
    },
    {
      id: 'privateKey',
      title: 'Private Key',
      type: 'long-input',
      layout: 'full',
      placeholder: '-----BEGIN OPENSSH PRIVATE KEY-----\n...',
      password: true,
      condition: { field: 'authType', value: 'privateKey' },
      description: 'Private key in PEM/OpenSSH format',
    },
    {
      id: 'passphrase',
      title: 'Key Passphrase',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Optional passphrase protecting the key',
      password: true,
      condition: { field: 'authType', value: 'privateKey' },
      description: 'Passphrase protecting the private key (if any)',
    },
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      required: true,
      options: [
        { label: 'Execute Command', id: 'execute_command' },
        { label: 'Run Script', id: 'run_script' },
        { label: 'Read File', id: 'read_file' },
        { label: 'Write File', id: 'write_file' },
        { label: 'Append File', id: 'append_file' },
        { label: 'Delete File', id: 'delete_file' },
        { label: 'Rename / Move', id: 'rename' },
        { label: 'File Stat', id: 'file_stat' },
        { label: 'Change Permissions', id: 'change_permissions' },
        { label: 'List Directory', id: 'list_directory' },
        { label: 'Create Directory', id: 'create_directory' },
        { label: 'Remove Directory', id: 'remove_directory' },
        { label: 'Check Exists', id: 'check_exists' },
      ],
      value: () => 'execute_command',
    },
    {
      id: 'command',
      title: 'Command',
      type: 'long-input',
      layout: 'full',
      placeholder: 'ls -la /var/www',
      condition: { field: 'operation', value: 'execute_command' },
      required: true,
      description: 'Shell command to run on the remote host',
    },
    {
      id: 'script',
      title: 'Script',
      type: 'code',
      layout: 'full',
      language: 'javascript',
      placeholder: '#!/bin/bash\nset -e\ncd /var/www\ngit pull',
      condition: { field: 'operation', value: 'run_script' },
      required: true,
      description: 'Multi-line shell script to run on the remote host',
    },
    {
      id: 'path',
      title: 'Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/home/user/file.txt',
      condition: { field: 'operation', value: FILE_OPS },
      required: true,
      description: 'Absolute remote path for the operation',
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'File content to write...',
      condition: { field: 'operation', value: ['write_file', 'append_file'] },
      required: true,
      description: 'Content to write or append',
    },
    {
      id: 'newPath',
      title: 'New Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/home/user/renamed.txt',
      condition: { field: 'operation', value: 'rename' },
      required: true,
      description: 'Destination path for rename/move',
    },
    {
      id: 'mode',
      title: 'Permission Mode',
      type: 'short-input',
      layout: 'half',
      placeholder: '755',
      condition: { field: 'operation', value: 'change_permissions' },
      required: true,
      description: 'Octal permission mode (e.g. 755, 0644)',
    },
    {
      id: 'recursive',
      title: 'Recursive',
      type: 'switch',
      layout: 'full',
      condition: { field: 'operation', value: ['create_directory', 'remove_directory'] },
      description: 'Create parent directories (mkdir -p) or remove contents (rm -rf)',
    },
    {
      id: 'encoding',
      title: 'Encoding',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'UTF-8', id: 'utf8' },
        { label: 'Base64', id: 'base64' },
      ],
      value: () => 'utf8',
      condition: { field: 'operation', value: ['read_file', 'write_file', 'append_file'] },
      description: 'Encoding for file content',
    },
  ],
  tools: {
    access: [
      'ssh_execute_command',
      'ssh_run_script',
      'ssh_read_file',
      'ssh_write_file',
      'ssh_append_file',
      'ssh_delete_file',
      'ssh_rename',
      'ssh_file_stat',
      'ssh_change_permissions',
      'ssh_list_directory',
      'ssh_create_directory',
      'ssh_remove_directory',
      'ssh_check_exists',
    ],
    config: {
      tool: (params) => {
        switch (params.operation) {
          case 'execute_command':
            return 'ssh_execute_command'
          case 'run_script':
            return 'ssh_run_script'
          case 'read_file':
            return 'ssh_read_file'
          case 'write_file':
            return 'ssh_write_file'
          case 'append_file':
            return 'ssh_append_file'
          case 'delete_file':
            return 'ssh_delete_file'
          case 'rename':
            return 'ssh_rename'
          case 'file_stat':
            return 'ssh_file_stat'
          case 'change_permissions':
            return 'ssh_change_permissions'
          case 'list_directory':
            return 'ssh_list_directory'
          case 'create_directory':
            return 'ssh_create_directory'
          case 'remove_directory':
            return 'ssh_remove_directory'
          case 'check_exists':
            return 'ssh_check_exists'
          default:
            throw new Error(`Invalid SSH operation: ${params.operation}`)
        }
      },
      params: (params) => {
        const { authType, ...rest } = params
        // Only forward the credential matching the chosen auth method.
        if (authType === 'privateKey') {
          const { password, ...keyParams } = rest
          return keyParams
        }
        const { privateKey, passphrase, ...pwParams } = rest
        return pwParams
      },
    },
  },
  inputs: {
    host: { type: 'string', description: 'SSH hostname or IP' },
    port: { type: 'number', description: 'SSH port' },
    username: { type: 'string', description: 'SSH username' },
    authType: { type: 'string', description: 'Authentication method: password or privateKey' },
    password: { type: 'string', description: 'SSH password' },
    privateKey: { type: 'string', description: 'Private key in PEM format' },
    passphrase: { type: 'string', description: 'Private key passphrase' },
    operation: { type: 'string', description: 'Operation to perform' },
    command: { type: 'string', description: 'Command to execute' },
    script: { type: 'string', description: 'Script to run' },
    path: { type: 'string', description: 'Remote path for the operation' },
    content: { type: 'string', description: 'Content to write or append' },
    newPath: { type: 'string', description: 'Destination path for rename' },
    mode: { type: 'string', description: 'Octal permission mode' },
    recursive: { type: 'boolean', description: 'Recursive directory operation' },
    encoding: { type: 'string', description: 'File content encoding' },
  },
  outputs: {
    stdout: { type: 'string', description: 'Command/script standard output' },
    stderr: { type: 'string', description: 'Command/script standard error' },
    code: { type: 'number', description: 'Command/script exit code' },
    signal: { type: 'string', description: 'Signal that terminated the command' },
    path: { type: 'string', description: 'Remote path acted on' },
    content: { type: 'string', description: 'File content (read_file)' },
    size: { type: 'number', description: 'File size in bytes (read_file)' },
    encoding: { type: 'string', description: 'Encoding of returned content' },
    bytesWritten: { type: 'number', description: 'Bytes written (write_file)' },
    bytesAppended: { type: 'number', description: 'Bytes appended (append_file)' },
    deleted: { type: 'boolean', description: 'Whether a file was deleted' },
    newPath: { type: 'string', description: 'Destination path (rename)' },
    renamed: { type: 'boolean', description: 'Whether the rename succeeded' },
    info: { type: 'json', description: 'File metadata (file_stat)' },
    mode: { type: 'string', description: 'Applied permission mode' },
    entries: { type: 'json', description: 'Directory entries (list_directory)' },
    count: { type: 'number', description: 'Number of directory entries' },
    created: { type: 'boolean', description: 'Whether a directory was created' },
    removed: { type: 'boolean', description: 'Whether a directory was removed' },
    exists: { type: 'boolean', description: 'Whether the path exists' },
    error: { type: 'string', description: 'Error message if the operation fails' },
  },
}
