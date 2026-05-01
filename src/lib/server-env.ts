function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPublicSupabaseEnv() {
  return {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

export function getSupabaseServiceRoleKey() {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? null;
}

export function getAllowedEmailDomains(): string[] {
  return (process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailDomainAllowed(email: string): boolean {
  const allowed = getAllowedEmailDomains();
  if (allowed.length === 0) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return Boolean(domain && allowed.includes(domain));
}
