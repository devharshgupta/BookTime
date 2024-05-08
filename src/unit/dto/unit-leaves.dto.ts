import {
  IsString,
  IsISO8601,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { IsGreaterThanStartDateTime } from 'src/config/validators/custom-unit-validators';

export class UnitLeaveDto {
  @IsString()
  @IsNotEmpty()
  externalUnitId: string;

  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsISO8601()
  @IsNotEmpty()
  startDatetime: string;

  @IsISO8601()
  @IsGreaterThanStartDateTime() // Apply the custom validator
  @IsNotEmpty()
  endDatetime: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  metaText?: string;
}
