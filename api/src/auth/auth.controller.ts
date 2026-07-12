import { Controller, ExecutionContext, Get, Injectable, Post, Req, Res, UseGuards, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Injectable()
class GoogleCallbackGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext) {
    const result = await super.canActivate(context);
    const request = context.switchToHttp().getRequest();
    await super.logIn(request);
    return result as boolean;
  }
}

@Controller('api/auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  googleCallback(@Res() res: Response) {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }

  @Get('me')
  me(@Req() req: Request) {
    if (!req.isAuthenticated()) throw new UnauthorizedException();
    return req.user;
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res() res: Response): void {
    req.logout((err) => {
      if (err) {
        res.status(500).json({ message: 'Logout failed' });
        return;
      }
      req.session.destroy(() => res.json({ message: 'Logged out' }));
    });
  }
}
