import crypto from 'crypto';

export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  // Ensure rawBody is treated as a string to prevent type errors in hmac.update
  const bodyStr = typeof rawBody === 'string' ? rawBody : '';
  const sig = signature.startsWith('sha256=') ? signature : `sha256=${signature}`;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(bodyStr).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
  } catch {
    return false;
  }
}
