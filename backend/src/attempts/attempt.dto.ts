import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OptionKey } from '../generated/prisma/client.js';

export class AnswerDraftDto {
  @IsUUID()
  questionId: string;

  // null nghĩa là bỏ chọn, undefined nghĩa là giữ nguyên
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsEnum(OptionKey)
  selectedOption?: OptionKey | null;

  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;
}

export class SaveAnswersDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AnswerDraftDto)
  answers: AnswerDraftDto[];
}
