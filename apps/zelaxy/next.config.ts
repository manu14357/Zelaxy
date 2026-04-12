import path from 'path'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import { env, isTruthy } from './lib/env'
import { isDev, isHosted, isProd } from './lib/environment'
import { getMainCSPPolicy, getWorkflowExecutionCSPPolicy } from './lib/security/csp'

const nextConfig: NextConfig = {
  devIndicators: false,
  // Packages that should only be resolved on the server (Node.js), never
  // bundled into the client. Prevents "Module not found: Can't resolve 'fs'"
  // errors when these are dynamically imported inside server-side code paths.
  // @sentry/opentelemetry is excluded from bundling so Turbopack's ESM static
  // analysis doesn't fail on the sdk-trace-base@2.x import of `defaultResource`
  // from the hoisted @opentelemetry/resources@1.x (which no longer exports it).
  // Node.js loads it at runtime via CJS, which is lenient about missing exports.
  serverExternalPackages: [
    'sharp',
    'tesseract.js',
    'pdf-parse',
    'detect-libc',
    'mupdf',
    '@sentry/opentelemetry',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.stability.ai',
      },
      // Azure Blob Storage
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
      // AWS S3 - various regions and bucket configurations
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      // Custom domain for file storage if configured
      ...(env.NEXT_PUBLIC_BLOB_BASE_URL
        ? [
            {
              protocol: 'https' as const,
              hostname: new URL(env.NEXT_PUBLIC_BLOB_BASE_URL).hostname,
            },
          ]
        : []),
    ],
  },
  typescript: {
    ignoreBuildErrors: isTruthy(env.DOCKER_BUILD),
  },
  eslint: {
    ignoreDuringBuilds: isTruthy(env.DOCKER_BUILD),
  },
  output: isTruthy(env.DOCKER_BUILD)
    ? 'standalone'
    : process.env.CLOUDFLARE_PAGES
      ? 'export'
      : undefined,
  trailingSlash: !!process.env.CLOUDFLARE_PAGES,
  turbopack: {
    root: path.join(__dirname, '../../'),
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  experimental: {
    optimizeCss: true,
    turbopackSourceMaps: false,
  },
  ...(isDev && {
    allowedDevOrigins: [
      ...(env.NEXT_PUBLIC_APP_URL
        ? (() => {
            try {
              return [new URL(env.NEXT_PUBLIC_APP_URL).host]
            } catch {
              return []
            }
          })()
        : []),
      'localhost:3000',
      'docs.localhost:3000',
    ],
    outputFileTracingRoot: path.join(__dirname, '../../'),
  }),
  transpilePackages: [
    'prettier',
    '@react-email/components',
    '@react-email/render',
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
  ],
  async headers() {
    return [
      {
        // API routes CORS headers
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          {
            key: 'Access-Control-Allow-Origin',
            value: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,OPTIONS,PUT,DELETE',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key',
          },
        ],
      },
      // For workflow execution API endpoints
      {
        source: '/api/workflows/:id/execute',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,OPTIONS,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key',
          },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          {
            key: 'Content-Security-Policy',
            value: getWorkflowExecutionCSPPolicy(),
          },
        ],
      },
      {
        // Exclude Vercel internal resources and static assets from strict COEP, Google Drive Picker to prevent 'refused to connect' issue
        source: '/((?!_next|_vercel|api|favicon.ico|w/.*|arena/.*|api/tools/drive).*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // For main app routes, Google Drive Picker, and Vercel resources - use permissive policies
        source: '/(w/.*|arena/.*|api/tools/drive|_next/.*|_vercel/.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
      // Block access to sourcemap files (defense in depth)
      {
        source: '/(.*)\\.map$',
        headers: [
          {
            key: 'x-robots-tag',
            value: 'noindex',
          },
        ],
      },
      // Apply security headers to routes not handled by middleware runtime CSP
      // Middleware handles: /, /arena/*, /chat/*
      {
        source: '/((?!arena|chat$).*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: getMainCSPPolicy(),
          },
        ],
      },
    ]
  },
  async redirects() {
    // Only enable domain redirects for the hosted version
    if (!isHosted) {
      return []
    }

    return [
      {
        source: '/((?!api|_next|_vercel|favicon|static|.*\\..*).*)',
        destination: 'https://www.zelaxy.in/$1',
        permanent: true,
        has: [{ type: 'host', value: 'zelaxy.in' }],
      },
      {
        source: '/((?!api|_next|_vercel|favicon|static|.*\\..*).*)',
        destination: 'https://www.zelaxy.in/$1',
        permanent: true,
        has: [{ type: 'host', value: 'www.zelaxy.in' }],
      },
    ]
  },
  async rewrites() {
    // Proxy docs subdomain requests to the docs app.
    // The internal URL defaults to localhost:3001 and can be overridden via
    // DOCS_INTERNAL_URL for production / custom setups.
    const docsInternalUrl = process.env.DOCS_INTERNAL_URL || 'http://docs.localhost:3001'

    // Extract the docs hostname from the public docs URL to match against.
    const docsPublicUrl = process.env.NEXT_PUBLIC_DOCUMENTATION_URL || 'http://docs.localhost:3000'
    let docsHost: string
    try {
      docsHost = new URL(docsPublicUrl).hostname
    } catch {
      docsHost = 'docs.localhost'
    }

    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [{ type: 'host', value: docsHost }],
          destination: `${docsInternalUrl}/:path*`,
        },
      ],
    }
  },
}

const sentryConfig = {
  silent: !process.env.CI,
  org: env.SENTRY_ORG || '',
  project: env.SENTRY_PROJECT || '',
  authToken: env.SENTRY_AUTH_TOKEN || undefined,
  disableSourceMapUpload: !isProd,
  autoInstrumentServerFunctions: isProd,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
}

export default isDev ? nextConfig : withSentryConfig(nextConfig, sentryConfig)
