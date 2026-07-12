export interface CreateCalendarRequest {
  channelUrl: string;
  niche: string;
  preferences?: string;
}

export interface CreateCalendarResponse {
  jobId: string;
}
