import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function connectionString(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy apps/api/.env.example to apps/api/.env.",
    );
  }

  return url;
}

let cached: ReturnType<typeof create> | undefined;

function create() {
  return drizzle(postgres(connectionString()), { schema });
}

/**
 * Lazily created so importing the package never opens a connection — the API
 * reads `DATABASE_URL` at request time, not at module load.
 */
export function getDb() {
  cached ??= create();

  return cached;
}

export type Database = ReturnType<typeof getDb>;
