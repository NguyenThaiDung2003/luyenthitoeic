import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard, RolesGuard } from './guards.js';

const MIN_SECRET_LENGTH = 32;

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        // Không khởi động với khóa thiếu hoặc yếu, chuỗi mẫu cũng bị chặn vì quá ngắn
        if (!secret || secret.length < MIN_SECRET_LENGTH) {
          throw new Error(`JWT_SECRET phải có ít nhất ${MIN_SECRET_LENGTH} ký tự`);
        }
        return {
          secret,
          signOptions: { expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 7200) },
          verifyOptions: { algorithms: ['HS256'] },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
