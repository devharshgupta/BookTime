import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ScheduleQueryDto {
  @IsDateString()
  @IsOptional()
  readonly startDate?: string;

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
    maximum: 31,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(31)
  @IsOptional()
  readonly plusDays?: number = 0;
}
