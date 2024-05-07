import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUnitLeaveDto {
  @IsString()
  unitId: string;

  @IsDateString()
  startDatetime: Date;

  @IsDateString()
  endDatetime: Date;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaText?: string;
}

export class UpdateUnitLeaveDto {
  @IsDateString()
  @IsOptional()
  startDatetime?: Date;

  @IsDateString()
  @IsOptional()
  endDatetime?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaText?: string;
}
