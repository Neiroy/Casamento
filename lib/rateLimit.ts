/**
 * Rate limiting simples em memória.
 * Em produção com múltiplas instâncias, considere Redis (ex: @upstash/ratelimit).
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const CLEANUP_INTERVAL = 60_000; // 1 min

function cleanup() {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) store.delete(key);
  });
}
setInterval(cleanup, CLEANUP_INTERVAL);

/** Obtém IP da requisição (considera proxies) */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/** Retorna true se dentro do limite, false se excedeu */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: config.maxRequests - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  return {
    ok: entry.count <= config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

/** Configs por endpoint */
export const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas / 15 min
  mensagens: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 mensagens / min
  pagamento: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 pagamentos / min
} as const;
