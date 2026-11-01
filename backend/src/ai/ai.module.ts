import { Module } from '@nestjs/common';
import { AttemptsModule } from '../attempts/attempts.module.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { GeminiClient } from './gemini.client.js';

@Module({
  imports: [AttemptsModule],
  controllers: [AiController],
  providers: [AiService, GeminiClient],
})
export class AiModule {}
