import chalk from 'chalk'
import Table from 'cli-table3'
import ora, { type Ora } from 'ora'

// ─── Spinners ──────────────────────────────────────────────────────────────

export function spinner(text: string): Ora {
  return ora({ text, color: 'cyan' })
}

// ─── Tables ────────────────────────────────────────────────────────────────

export function table(head: string[], rows: (string | number | null | undefined)[][]): string {
  const t = new Table({
    head: head.map((h) => chalk.cyan.bold(h)),
    style: { head: [], border: [] },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  })
  for (const row of rows) {
    t.push(row.map((c) => String(c ?? '—')))
  }
  return t.toString()
}

// ─── Output helpers ────────────────────────────────────────────────────────

export function success(msg: string): void {
  console.log(chalk.green('✓'), msg)
}

export function error(msg: string): void {
  console.error(chalk.red('✗'), msg)
}

export function warn(msg: string): void {
  console.log(chalk.yellow('⚠'), msg)
}

export function info(msg: string): void {
  console.log(chalk.blue('ℹ'), msg)
}

export function dim(msg: string): void {
  console.log(chalk.dim(msg))
}

export function json(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

// ─── Error handling ────────────────────────────────────────────────────────

export function handleError(err: unknown): never {
  if (err instanceof Error) {
    const zelaxyErr = err as any
    if (zelaxyErr.status === 401) {
      error('Authentication failed. Run `zelaxy auth login` to re-authenticate.')
    } else if (zelaxyErr.status === 404) {
      error(`Not found: ${zelaxyErr.message}`)
    } else if (zelaxyErr.code === 'ECONNREFUSED') {
      error('Cannot connect to Zelaxy server. Is it running?')
    } else {
      error(zelaxyErr.message)
    }
  } else {
    error(String(err))
  }
  process.exit(1)
}

// ─── Misc ──────────────────────────────────────────────────────────────────

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return `${str.slice(0, max - 1)}…`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}
