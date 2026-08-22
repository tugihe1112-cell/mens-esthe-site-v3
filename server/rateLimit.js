import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const normalizeHeader = (value) => Array.isArray(value) ? value[0] : value;

/**
 * Vercelが付与する転送元IPを優先する。値そのものはDBへ保存せず、HMAC化して使う。
 */
export function requestIp(req) {
  const forwarded = normalizeHeader(
    req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'],
  );
  return String(forwarded || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 128);
}

function rateKey(scope, subject, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${scope}:${String(subject).normalize('NFKC').trim().toLowerCase()}`)
    .digest('hex');
}

/**
 * public.consume_api_rate_limit は1 SQL文のUPSERTで加算と判定を行うため、
 * サーバーレス関数が並列起動しても「同時に残数を読んで両方通る」競合が起きない。
 */
export async function consumeRateLimit({ scope, subject, limit, windowSeconds }) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.RATE_LIMIT_SALT || serviceRoleKey;
  if (!supabaseUrl || !serviceRoleKey || !secret) {
    throw new Error('Rate limiter is not configured');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.rpc('consume_api_rate_limit', {
    p_key: rateKey(scope, subject, secret),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(`Rate limiter failed: ${error.message}`);
  return data === true;
}

export function rejectRateLimit(res, retryAfterSeconds) {
  res.setHeader('Retry-After', String(retryAfterSeconds));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(429).json({
    error: '短時間に送信できる回数を超えました。時間をおいてもう一度お試しください。',
  });
}
