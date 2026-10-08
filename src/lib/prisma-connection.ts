export function getPrismaConnectionString(
  env: Record<string, string | undefined>
): string | undefined {
  return env.PRIMEZORA_DATABASE_TARGET === "production"
    ? env.DATABASE_URL ?? env.DIRECT_DATABASE_URL
    : env.DIRECT_DATABASE_URL_TEST ?? env.DATABASE_URL_TEST;
}
