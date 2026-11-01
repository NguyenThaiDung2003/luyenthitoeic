import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Giới hạn theo email vì IP không đáng tin khi đi qua proxy: Vercel ra Internet bằng nhiều IP khác nhau
@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected getTracker(request: { body?: { email?: unknown }; ip?: string }) {
    const { email } = request.body ?? {};
    return Promise.resolve(
      typeof email === 'string' ? `email:${email.trim().toLowerCase()}` : (request.ip ?? ''),
    );
  }
}
