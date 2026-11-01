import { Module } from '@nestjs/common';
import { PassagesController } from './passages.controller.js';
import { QuestionsController } from './questions.controller.js';
import { QuestionsService } from './questions.service.js';

@Module({
  controllers: [QuestionsController, PassagesController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
