// The suite runs against its own database so it never touches dev data.
const DEFAULT_DEV_URL = "postgresql://malabi:malabi@localhost:5432/malabi?schema=public";

export const E2E_PORT = 3100;
export const E2E_DB_NAME = "malabi_e2e";

/** Connection used only to CREATE DATABASE (the normal dev database). */
export const MAINTENANCE_DATABASE_URL = process.env.DATABASE_URL ?? DEFAULT_DEV_URL;

export function e2eDatabaseUrl(): string {
  const url = new URL(MAINTENANCE_DATABASE_URL);
  url.pathname = `/${E2E_DB_NAME}`;
  return url.toString();
}

export const ADMIN = { email: "e2e-admin@malabi.test", password: "e2e-password-123" };
export const CUSTOMER = { phone: "+972500000001" };
