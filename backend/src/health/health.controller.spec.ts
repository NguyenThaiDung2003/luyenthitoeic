import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('trả về ok khi CSDL phản hồi', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([1]) };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('trả về 503 khi không kết nối được CSDL', async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error('down')) };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
