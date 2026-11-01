import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Difficulty, Part } from '../generated/prisma/client.js';

class ExamInfoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(300)
  durationMinutes: number;
}

export class CreateExamDto extends ExamInfoDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  questionIds: string[];
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

export class RandomCriterionDto {
  @IsOptional()
  @IsEnum(Part)
  part?: Part;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsInt()
  @Min(1)
  @Max(200)
  count: number;
}

export class RandomExamDto extends ExamInfoDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RandomCriterionDto)
  criteria: RandomCriterionDto[];
}
