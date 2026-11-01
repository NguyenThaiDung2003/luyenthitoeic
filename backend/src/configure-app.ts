import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

// Dùng chung cho main.ts và test để test chạy đúng cấu hình thật
export function configureApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  // Số proxy đứng trước backend, cần đúng để giới hạn tốc độ theo IP thật của người dùng
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3002',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
}
