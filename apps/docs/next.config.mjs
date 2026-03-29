import path from 'path'
import { fileURLToPath } from 'url'
import { createMDX } from 'fumadocs-mdx/next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // In dev the docs app is served via a subdomain proxy (docs.localhost:3000).
  // Assets and HMR must connect directly to the docs server so the main
  // app's HMR handler doesn't intercept them.  Configured via the
  // DOCS_DEV_ORIGIN env var set in the dev script.
  ...(isDev && {
    ...(process.env.DOCS_DEV_ORIGIN && {
      assetPrefix: process.env.DOCS_DEV_ORIGIN,
    }),
    allowedDevOrigins: [process.env.DOCS_ALLOWED_ORIGIN || 'docs.localhost:3000'],
  }),
}

const withMDX = createMDX()

export default withMDX(config)
