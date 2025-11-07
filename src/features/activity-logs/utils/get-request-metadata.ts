import type { Context } from 'hono';

/**
 * Extract request metadata from Hono context
 */
export function getRequestMetadata(ctx: Context): {
  ipAddress?: string;
  userAgent?: string;
} {
  const metadata: { ipAddress?: string; userAgent?: string } = {};

  // Get IP address
  const forwardedFor = ctx.req.header('x-forwarded-for');
  const realIp = ctx.req.header('x-real-ip');
  const cfConnectingIp = ctx.req.header('cf-connecting-ip');

  let rawIp: string | undefined;

  if (cfConnectingIp) {
    rawIp = cfConnectingIp;
  } else if (realIp) {
    rawIp = realIp;
  } else if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    rawIp = forwardedFor.split(',')[0].trim();
  }

  // Normalize IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
  if (rawIp) {
    if (rawIp.startsWith('::ffff:')) {
      metadata.ipAddress = rawIp.replace('::ffff:', '');
    } else {
      metadata.ipAddress = rawIp;
    }
  }

  // Get User Agent
  const userAgent = ctx.req.header('user-agent');
  if (userAgent) {
    metadata.userAgent = userAgent;
  }

  return metadata;
}
