import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { QuotaService } from './quota.service';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private readonly quotaService: QuotaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { id: string } | undefined;

    if (!user?.id) return true;

    try {
      await this.quotaService.checkActiveJob(user.id);
      await this.quotaService.checkDailyLimit(user.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Quota exceeded';
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
