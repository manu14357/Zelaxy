import type { Config } from 'drizzle-kit'
import { env } from './lib/env'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL || env.DATABASE_URL,
  },
} satisfies Config
