import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// Dùng chung cho main.ts và test để test chạy đúng cấu hình thật
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3002',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
}
