export class ChannelNotFoundError extends Error {
  constructor(channel: string) {
    super(`Channel not found: ${channel}`);
    this.name = 'ChannelNotFoundError';
  }
}

export class QuotaExceededError extends Error {
  readonly limit: number;
  constructor(limit: number) {
    super(`Daily limit reached. Max ${limit} jobs per day.`);
    this.name = 'QuotaExceededError';
    this.limit = limit;
  }
}

export class JobFailedError extends Error {
  constructor(jobId: string, reason?: string) {
    super(reason ?? `Job ${jobId} failed`);
    this.name = 'JobFailedError';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}
