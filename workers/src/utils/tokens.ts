/**
 * Token keys follow the pattern: token:{client_id}:{provider}
 * Stored in Workers Secrets via KV (encrypted at rest).
 * Expiry tracked separately as: token_expiry:{client_id}:{provider}
 */

export interface TokenInfo {
  token: string;
  expiresAt: string | null;
}

export async function getToken(
  kv: KVNamespace,
  clientId: string,
  provider: 'instagram' | 'facebook' | 'google'
): Promise<TokenInfo | null> {
  const token = await kv.get(`token:${clientId}:${provider}`);
  if (!token) return null;

  const expiresAt = await kv.get(`token_expiry:${clientId}:${provider}`);
  return { token, expiresAt };
}

export async function setToken(
  kv: KVNamespace,
  clientId: string,
  provider: 'instagram' | 'facebook' | 'google',
  token: string,
  expiresAt?: string
): Promise<void> {
  await kv.put(`token:${clientId}:${provider}`, token);
  if (expiresAt) {
    await kv.put(`token_expiry:${clientId}:${provider}`, expiresAt);
  }
}

export function isTokenExpiringSoon(expiresAt: string | null, daysThreshold: number = 7): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  const threshold = Date.now() + daysThreshold * 24 * 60 * 60 * 1000;
  return expiry < threshold;
}
