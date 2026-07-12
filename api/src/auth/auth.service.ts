import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';

@Injectable()
export class AuthService {
  constructor(@Inject('DB') private db: any) {}

  async getOrCreateUser(profile: {
    id: string;
    emails?: Array<{ value: string }>;
    displayName: string;
    photos?: Array<{ value: string }>;
  }) {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value ?? '';
    const name = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    const [existing] = await this.db.select().from(users).where(eq(users.google_id, googleId));
    if (existing) return existing;

    const [created] = await this.db
      .insert(users)
      .values({ email, name, avatar_url: avatarUrl, google_id: googleId })
      .returning();
    return created;
  }

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }
}
