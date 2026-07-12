import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

function extractHttpMessage(ex: HttpException): string {
  const res = ex.getResponse();
  if (typeof res === 'string') return res;
  if (typeof res === 'object' && res !== null) {
    const r = res as Record<string, unknown>;
    const msg = Array.isArray(r.message) ? r.message[0] : r.message;
    if (typeof msg === 'string') return msg;
  }
  return ex.message;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = extractHttpMessage(exception);

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        const match = raw.match(/Max (\d+)/);
        const limit = match ? match[1] : '5';
        message = `You've reached your daily limit of ${limit} calendars. Try again tomorrow.`;
      } else if (
        status === HttpStatus.BAD_REQUEST &&
        raw.toLowerCase().includes('channel')
      ) {
        message =
          'We could not resolve this YouTube channel URL. Please check that the channel is public and try again.';
      } else {
        message = raw;
      }
    } else if (exception instanceof Error) {
      const name = exception.name;

      if (name === 'InvalidChannelUrlError' || name === 'ChannelNotFoundError') {
        status = HttpStatus.BAD_REQUEST;
        message =
          'We could not resolve this YouTube channel URL. Please check that the channel is public and try again.';
      } else if (name === 'QuotaExceededError') {
        status = HttpStatus.TOO_MANY_REQUESTS;
        const match = exception.message.match(/Max (\d+)/);
        const limit = match ? match[1] : '5';
        message = `You've reached your daily limit of ${limit} calendars. Try again tomorrow.`;
      } else if (name === 'JobFailedError') {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
      } else if (name === 'InvalidInputError') {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
    });
  }
}
