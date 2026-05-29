/**
 * Browser stub for the `postgres` npm package.
 *
 * `postgres` uses Node.js built-ins (fs, net, tls, perf_hooks) and cannot be
 * bundled for the browser. This stub is resolved instead of the real package
 * in browser builds (via turbopack.resolveAlias in next.config.ts), preventing
 * "Module not found: Can't resolve 'fs'" build errors.
 *
 * At runtime in the browser any code path that reaches `@/db` will receive a
 * non-functional db client and throw a descriptive error — this is intentional
 * because database access is server-only.
 */

function postgres() {
  // Return an object that passes through drizzle's constructor without throwing,
  // but fails with a clear message when a query is actually executed.
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'options' || prop === 'parameters' || prop === 'types') return {}
        return () => {
          throw new Error(
            'Database queries are not available in browser context. ' +
              'The postgres client is server-only.'
          )
        }
      },
    }
  )
}

postgres.PostgresError = class PostgresError extends Error {}

module.exports = postgres
module.exports.default = postgres
