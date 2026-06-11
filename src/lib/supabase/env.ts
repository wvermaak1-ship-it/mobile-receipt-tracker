function firstDefined(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    if (value) return value;
  }
  return undefined;
}

/** Resolves Supabase URL from standard or Vercel-integration env var names. */
export function getSupabaseUrl(): string {
  const url = firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_thzwbzejlzzcfgvdgeiz_SUPABASE_URL,
    process.env.thzwbzejlzzcfgvdgeiz_SUPABASE_URL,
    process.env.SUPABASE_URL
  );

  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or connect the Supabase Vercel integration."
    );
  }

  return url;
}

/** Resolves the public anon key from standard or Vercel-integration env var names. */
export function getSupabaseAnonKey(): string {
  const key = firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_thzwbzejlzzcfgvdgeiz_SUPABASE_ANON_KEY,
    process.env.thzwbzejlzzcfgvdgeiz_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY
  );

  if (!key) {
    throw new Error(
      "Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or connect the Supabase Vercel integration."
    );
  }

  return key;
}

/** Resolves the service role key for server-only admin operations. */
export function getSupabaseServiceRoleKey(): string {
  const key = firstDefined(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.thzwbzejlzzcfgvdgeiz_SUPABASE_SERVICE_ROLE_KEY
  );

  if (!key) {
    throw new Error(
      "Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY or connect the Supabase Vercel integration."
    );
  }

  return key;
}
