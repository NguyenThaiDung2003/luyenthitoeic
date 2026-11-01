import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { type AuthUser, CurrentUser, Public } from './decorators.js';
import { ACCESS_TOKEN_COOKIE } from './guards.js';

const AUTH_LIMIT = {
  default: { limit: () => Number(process.env.AUTH_RATE_LIMIT ?? 10), ttl: 60_000 },
};

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

function setSessionCookie(response: Response, token: string) {
  response.cookie(ACCESS_TOKEN_COOKIE, token, {
    ...cookieOptions(),
    maxAge: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 7200) * 1000,
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.auth.register(dto);
    setSessionCookie(response, token);
    return { user };
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.auth.login(dto);
    setSessionCookie(response, token);
    return { user };
  }

  @HttpCode(204)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions());
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return { user: await this.auth.me(user.id) };
  }
}
