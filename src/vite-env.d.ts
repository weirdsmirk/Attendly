/// <reference types="vite/client" />

/**
 * sql.js ships no type declarations, but it is the dev-only mirror's engine and
 * appears in vite.config.ts, which is type-checked alongside the app.
 */
declare module 'sql.js' {
  export interface QueryExecResult {
    columns: string[]
    values: (string | number | null)[][]
  }

  export interface Statement {
    bind(params?: unknown[]): [unknown, unknown]
    step(): boolean
    get(params?: unknown[]): (string | number | null)[]
    getAsObject(params?: unknown[]): Record<string, string | number | null>
    getColumnNames(): string[]
    reset(): void
    free(): boolean
  }

  export interface Database {
    run(sql: string, params?: unknown[]): Database
    exec(sql: string, params?: unknown[]): QueryExecResult[]
    prepare(sql: string, params?: unknown[]): Statement
    export(): Uint8Array
    close(): void
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | null) => Database
  }

  const initSqlJs: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>
  export default initSqlJs
}
