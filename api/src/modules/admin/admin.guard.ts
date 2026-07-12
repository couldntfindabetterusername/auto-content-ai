import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminEmails: string[];

  constructor() {
    this.adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as { email?: string } | undefined;
    if (!user?.email) throw new ForbiddenException();
    if (!this.adminEmails.includes(user.email.toLowerCase())) throw new ForbiddenException();
    return true;
  }
}
