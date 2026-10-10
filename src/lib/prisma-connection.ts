export function getPrismaConnectionString(
  env: Record<string, string | undefined>
): string | undefined {
  return env.PRIMEZORA_DATABASE_TARGET === "production"
    ? env.DATABASE_URL ?? env.DIRECT_DATABASE_URL
    : env.DIRECT_DATABASE_URL_TEST ?? env.DATABASE_URL_TEST;
}

export function getPrismaCliConnectionString(
  env: Record<string, string | undefined>
): string | undefined {
  if (env.PRIMEZORA_DATABASE_TARGET !== "production") {
    return env.DIRECT_DATABASE_URL;
  }

  if (env.MIGRATION_DATABASE_URL) {
    return env.MIGRATION_DATABASE_URL;
  }

  const runtimeUrl = env.DATABASE_URL;
  if (runtimeUrl) {
    try {
      const parsedUrl = new URL(runtimeUrl);
      if (
        parsedUrl.hostname.endsWith(".pooler.supabase.com") &&
        ["5432", "6543"].includes(parsedUrl.port)
      ) {
        parsedUrl.port = "5432";
        return parsedUrl.toString();
      }
    } catch {
      // Let Prisma report malformed DATABASE_URL; do not hide it with a fallback.
      return runtimeUrl;
    }
  }

  return env.DIRECT_DATABASE_URL;
}
