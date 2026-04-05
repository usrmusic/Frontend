export function extractUser(raw: unknown): { name?: string; profile_photo?: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  let payload: unknown = raw;
  if ('data' in r) payload = r['data'] as unknown;
  if (Array.isArray(payload)) payload = payload[0];
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const name = typeof p.name === 'string' ? p.name : (typeof p.full_name === 'string' ? p.full_name : (typeof p.couple_name === 'string' ? p.couple_name : undefined));
  const profile = typeof p.profile_photo === 'string' ? p.profile_photo : (typeof p.avatar === 'string' ? p.avatar : undefined);
  return { name, profile_photo: profile };
}
