import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Difficulty, OptionKey, Part } from '../generated/prisma/client.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateQuestionDto {
  @IsEnum(Part)
  part: Part;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(500, { each: true })
  options: string[];

  @IsEnum(OptionKey)
  correctOption: OptionKey;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsUUID()
  passageId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  explanation?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  source: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  license: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  audioUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  transcript?: string | null;
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

export class ListQuestionsQuery {
  @IsOptional()
  @IsEnum(Part)
  part?: Part;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
