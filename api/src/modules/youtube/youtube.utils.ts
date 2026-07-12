export type ParsedChannelInput =
  | { type: 'id'; value: string }
  | { type: 'handle'; value: string }
  | { type: 'username'; value: string }
  | { type: 'customUrl'; value: string };

const CHANNEL_ID_RE = /^UC[\w-]{22}$/;

export function parseChannelInput(input: string): ParsedChannelInput {
  const raw = input.trim();

  // Bare channel ID
  if (CHANNEL_ID_RE.test(raw)) {
    return { type: 'id', value: raw };
  }

  // Bare @handle
  if (raw.startsWith('@')) {
    return { type: 'handle', value: raw };
  }

  let pathname: string;
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (!['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'].includes(url.hostname)) {
      throw new Error('not_youtube');
    }
    pathname = url.pathname;
  } catch {
    throw new InvalidChannelUrlError(raw);
  }

  // /channel/UCxxxx
  const channelMatch = pathname.match(/^\/channel\/(UC[\w-]{22})/);
  if (channelMatch) return { type: 'id', value: channelMatch[1] };

  // /@handle or /@ (with possible trailing slash)
  const handleMatch = pathname.match(/^\/@([\w.-]+)/);
  if (handleMatch) return { type: 'handle', value: `@${handleMatch[1]}` };

  // /c/customUrl
  const customMatch = pathname.match(/^\/c\/([\w.-]+)/);
  if (customMatch) return { type: 'customUrl', value: customMatch[1] };

  // /user/username
  const userMatch = pathname.match(/^\/user\/([\w.-]+)/);
  if (userMatch) return { type: 'username', value: userMatch[1] };

  throw new InvalidChannelUrlError(raw);
}

export class InvalidChannelUrlError extends Error {
  constructor(input: string) {
    super(`Invalid YouTube channel URL or ID: "${input}"`);
    this.name = 'InvalidChannelUrlError';
  }
}

export class ChannelNotFoundError extends Error {
  constructor(input: string) {
    super(`YouTube channel not found or private: "${input}"`);
    this.name = 'ChannelNotFoundError';
  }
}
