import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Role } from '../generated/prisma/client.js';
import { AuthUser, IS_PUBLIC_KEY, ROLES_KEY } from './decorators.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';

// Đọc cookie trực tiếp vì chỉ cần đúng một cookie, không cần thêm thư viện
function readCookie(header: string | undefined, name: string) {
  for (const part of header?.split(';') ?? []) {
    const separator = part.indexOf('=');
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return undefined;
}

function extractToken(request: Request) {
  const [scheme, value] = request.headers.authorization?.split(' ') ?? [];
  if (scheme === 'Bearer' && value) return value;
  return readCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = extractToken(request);
    if (!token) throw new UnauthorizedException('Bạn chưa đăng nhập');

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: Role }>(token);
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
    return true;
  }
}
