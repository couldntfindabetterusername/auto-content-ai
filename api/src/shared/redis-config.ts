export function getRedisOptions() {
  if (process.env.REDIS_URL) {
    const u = new URL(process.env.REDIS_URL);
    const opts: Record<string, unknown> = {
      host: u.hostname,
      port: parseInt(u.port || '6379'),
      // Upstash username is 'default' — include so ioredis AUTH command sends user:pass
      username: u.username || undefined,
      password: u.password || undefined,
      // BullMQ requires maxRetriesPerRequest:null so it can manage its own retry logic
      maxRetriesPerRequest: null,
    };
    // Upstash and TLS-enabled Redis use rediss:// — ioredis needs explicit tls:{} option
    if (u.protocol === 'rediss:') {
      opts.tls = {};
    }
    return opts;
  }
  // Local Docker Compose: use REDIS_HOST / REDIS_PORT service names
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
  };
}
