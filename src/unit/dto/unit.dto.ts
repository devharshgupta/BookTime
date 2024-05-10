import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsDateString,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { DayName } from 'src/common/constant/constant';
import {
  IsGreaterThanStartDateTime,
  TimeGreaterThan,
  TimeOverlap,
  UniqueDays,
} from 'src/config/validators/custom-unit-validators';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  externalUnitId: string;

  @IsISO8601()
  startDatetime: string;

  @IsISO8601()
  @IsGreaterThanStartDateTime() // Apply the custom validator
  endDatetime: string;

  @ValidateNested({ each: true }) // Validate each element in the array
  @ArrayNotEmpty({ message: 'At least one day must be provided.' })
  @ArrayMinSize(1, { message: 'At least one day must be provided.' })
  @Type(() => DaySlot) // Specify the type of elements in the array
  @UniqueDays({ message: 'Each day should exist only once.' })
  weeklyTimings: DaySlot[];

  @IsPositive()
  @IsOptional()
  slotFetchSizeInDays: number;

  @IsString()
  type: string;
}

export class SlotTime {
  // Todo - can apply validation that diffrence between endTime and startTime cannot be greater than slot duration
  @IsPositive()
  @IsNotEmpty()
  slotDuration: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:mm (24-hour format).',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:mm (24-hour format).',
  })
  @TimeGreaterThan('startTime') // Apply custom validation decorator
  endTime: string;

  @IsInt({ message: 'Value must be an integer.' })
  @Min(0, { message: 'Value must be a positive integer or zero.' })
  @IsNotEmpty()
  maxBooking: number;

  @IsString()
  @IsOptional()
  metaText?: string;
}

export class DaySlot {
  @IsEnum(DayName, {
    message: 'Invalid day name. Use Sunday, Monday, Tuesday, etc.',
  })
  dayName: DayName;

  @ValidateNested({ each: true }) // Validate each element in the array
  @ArrayNotEmpty({ message: 'At least one slot must be provided.' })
  @ArrayMinSize(1, { message: 'At least one slot must be provided.' })
  @Type(() => SlotTime) // Specify the type of elements in the array
  @TimeOverlap({ message: 'Time slots cannot overlap.' })
  slots: SlotTime[];
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  externalUnitId?: string;

  @IsOptional()
  @IsDateString()
  slotStartDatetime?: string;

  @IsOptional()
  @IsDateString()
  slotEndDatetime?: string;
}
