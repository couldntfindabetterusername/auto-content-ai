export function getRedisOptions() {
  if (process.env.REDIS_URL) {
    const u = new URL(process.env.REDIS_URL);
    return {
      host: u.hostname,
      port: parseInt(u.port || '6379'),
      password: u.password || undefined,
    };
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };
}
