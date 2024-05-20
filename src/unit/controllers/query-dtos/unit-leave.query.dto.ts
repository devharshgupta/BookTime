import { IsDateString, IsOptional, IsString } from 'class-validator';

import { PageOptionsDto } from 'src/common/dto/page-option.dto';

export class UnitLeaveQuery extends PageOptionsDto {
  @IsString()
  @IsOptional()
  id = '';

  @IsDateString()
  @IsOptional()
  readonly startDate?: string;

  @IsDateString()
  @IsOptional()
  readonly endDate?: string;
}
