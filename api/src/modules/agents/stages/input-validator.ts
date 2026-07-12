import { parseChannelInput } from '../../youtube/youtube.utils';

export interface RawJobInput {
  channelUrl: string;
  niche: string;
  preferences?: string;
}

export interface ValidatedInput {
  channelUrl: string;
  niche: string;
  preferences?: string;
}

const NICHE_MIN = 3;
const NICHE_MAX = 500;
const PREFS_MAX = 1000;

export class InputValidator {
  validate(input: RawJobInput): ValidatedInput {
    const channelUrl = (input.channelUrl ?? '').trim();
    const niche = (input.niche ?? '').trim();
    const preferences = input.preferences?.trim();

    if (!channelUrl) {
      throw new Error('channelUrl is required');
    }

    parseChannelInput(channelUrl); // throws InvalidChannelUrlError on bad input

    if (niche.length < NICHE_MIN) {
      throw new Error(`niche must be at least ${NICHE_MIN} characters`);
    }
    if (niche.length > NICHE_MAX) {
      throw new Error(`niche must not exceed ${NICHE_MAX} characters`);
    }

    if (preferences !== undefined && preferences.length > PREFS_MAX) {
      throw new Error(`preferences must not exceed ${PREFS_MAX} characters`);
    }

    return {
      channelUrl,
      niche,
      ...(preferences ? { preferences } : {}),
    };
  }
}
