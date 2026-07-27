/**
 * Stub for the `server-only` package under Vitest.
 *
 * `server-only` throws on import so a server module can never be pulled into a
 * client bundle. That guard is correct in the app but meaningless in a Node
 * test runner, where there is no client/server split — so vitest.config.ts
 * aliases the package here. The real guard still applies to every Next build.
 */
export {};
