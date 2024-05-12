import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  Matches,
  IsDateString,
} from 'class-validator';
import {
  isGreaterThanStartDate,
  TimeFormatAndIncrement,
  TimeGreaterThan,
} from 'src/config/validators/custom-class-validators';
import { UnitLeaves } from '../entities/unit-leaves.entity';

export class UnitLeaveDto implements Partial<UnitLeaves> {
  @IsString()
  @IsNotEmpty()
  externalUnitId: string;

  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @isGreaterThanStartDate() // Custom validator to check if end date is greater than start date
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  @TimeFormatAndIncrement()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @TimeFormatAndIncrement()
  @TimeGreaterThan('startTime') // Apply custom validation decorator
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  metaText?: string;
}
