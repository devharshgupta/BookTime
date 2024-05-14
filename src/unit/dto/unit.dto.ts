import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { DayName } from 'src/common/constant/constant';
import {
  EndTimeValidator,
  IncrementValidator,
  isGreaterThanStartDate,
  TimeFormatAndIncrement,
  TimeOverlap,
  UniqueDays,
} from 'src/config/validators/custom-class-validators';
import { UnitSchedule } from '../entities/unit-schedule.entity';
import { Unit } from '../entities/unit.entity';

export class UnitDto implements Partial<Unit> {
  @IsString()
  @IsNotEmpty()
  externalUnitId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @isGreaterThanStartDate() // Custom validator to check if end date is greater than start date
  @IsNotEmpty()
  endDate: string;

  @IsPositive()
  @IsOptional()
  slotFetchSizeInDays: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsBoolean()
  isActive: boolean;
}

export class SlotTime implements Partial<UnitSchedule> {
  @Validate(IncrementValidator, [5]) // Example: Increment of 5
  @IsNotEmpty()
  @Max(360) // 6 hours (to limt the max slot duration)
  slotDuration: number;

  @IsString()
  @IsNotEmpty()
  @TimeFormatAndIncrement()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @TimeFormatAndIncrement()
  @Validate(EndTimeValidator) // Validate the end time based on start time and slot duration
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
  weekDayName: DayName;

  @ValidateNested({ each: true }) // Validate each element in the array
  @ArrayNotEmpty({ message: 'At least one slot must be provided.' })
  @ArrayMinSize(1, { message: 'At least one slot must be provided.' })
  @Type(() => SlotTime) // Specify the type of elements in the array
  @TimeOverlap({ message: 'Time slots cannot overlap.' })
  slots: SlotTime[];
}

export class CreateUnitDto {
  @ValidateNested({ each: true })
  @Type(() => UnitDto)
  unit: UnitDto;

  @ValidateNested({ each: true }) // Validate each element in the array
  @ArrayNotEmpty({ message: 'At least one day must be provided.' })
  @ArrayMinSize(1, { message: 'At least one day must be provided.' })
  @Type(() => DaySlot) // Specify the type of elements in the array
  @UniqueDays({ message: 'Each day should exist only once.' })
  weeklyTimings: DaySlot[];
}

export class UpdateUnitDto {
  @ValidateNested({ each: true })
  @Type(() => UnitDto)
  unit: UnitDto;

  @IsOptional()
  @ValidateNested({ each: true }) // Validate each element in the array
  @ArrayNotEmpty({ message: 'At least one day must be provided.' })
  @ArrayMinSize(1, { message: 'At least one day must be provided.' })
  @Type(() => DaySlot) // Specify the type of elements in the array
  @UniqueDays({ message: 'Each day should exist only once.' })
  weeklyTimings: DaySlot[];
}
