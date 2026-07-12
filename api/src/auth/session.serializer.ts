import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private authService: AuthService) {
    super();
  }

  serializeUser(user: { id: string }, done: (err: any, id?: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(id: string, done: (err: any, user?: any) => void) {
    try {
      const user = await this.authService.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
}
