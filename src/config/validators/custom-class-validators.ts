import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Matches,
} from 'class-validator';

@ValidatorConstraint({ name: 'timeGreaterThan', async: false })
export class TimeGreaterThanConstraint implements ValidatorConstraintInterface {
  // This validation check is individual slot end time is always greater than individual slot start time
  validate(value: any, args: ValidationArguments) {
    const startTime = args.object[args.constraints[0]];
    const endTime = value;
    if (!startTime || !endTime) {
      return false; // Validation fails if start time or end time is not provided
    }
    return startTime < endTime; // Validation passes if end time is greater than start time
  }

  defaultMessage(args: ValidationArguments) {
    return `End time must be greater than start time.`;
  }
}

export function TimeGreaterThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: TimeGreaterThanConstraint,
    });
  };
}

export function TimeFormatAndIncrement(options?: ValidationOptions) {
  return Matches(/^(0[0-9]|1[0-9]|2[0-3]):([0-5][05])$/, {
    message:
      'Invalid time format. Use HH:mm (24-hour format) with minutes in increments of 5.',
    ...options,
  });
}

@ValidatorConstraint({ name: 'timeOverlap', async: false })
export class TimeOverlapConstraint implements ValidatorConstraintInterface {
  // This validation checks if all the provided slots are unique and they doesnot overlaps
  validate(slots: any[], args: ValidationArguments) {
    for (let i = 0; i < slots.length - 1; i++) {
      const currentStartTime = new Date(`2000-01-01T${slots[i].startTime}`);
      const currentEndTime = new Date(`2000-01-01T${slots[i].endTime}`);

      for (let j = i + 1; j < slots.length; j++) {
        const nextStartTime = new Date(`2000-01-01T${slots[j].startTime}`);
        const nextEndTime = new Date(`2000-01-01T${slots[j].endTime}`);

        if (currentStartTime < nextEndTime && nextStartTime < currentEndTime) {
          return false; // Overlapping slots found
        }
      }
    }

    return true; // No overlapping slots found
  }

  defaultMessage(args: ValidationArguments) {
    return 'Time slots cannot overlap.';
  }
}

export function TimeOverlap(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: TimeOverlapConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'uniqueDays', async: false })
export class UniqueDaysConstraint implements ValidatorConstraintInterface {
  // This Validation Checks a day like sunday is only provided once
  validate(weeklyTimings: any[], args: ValidationArguments) {
    const daysSet = new Set<string>();

    for (const weeklyTiming of weeklyTimings) {
      if (daysSet.has(weeklyTiming.weekDayName)) {
        return false; // Duplicate day found
      } else {
        daysSet.add(weeklyTiming.weekDayName);
      }
    }

    return true; // All days are unique
  }

  defaultMessage(args: ValidationArguments) {
    return 'Each day should exist only once.';
  }
}

export function UniqueDays(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueDaysConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isGreaterThanStartDateTime', async: false })
export class IsGreaterThanStartDateTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const startDatetime = args.object['startDatetime'];
    return (
      typeof value === 'string' &&
      typeof startDatetime === 'string' &&
      value > startDatetime
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be greater than startDatetime`;
  }
}

export function IsGreaterThanStartDateTime(
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsGreaterThanStartDateTimeConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isGreaterThanStartDate', async: false })
export class IsGreaterThanStartDateConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, args: ValidationArguments) {
    const startDate = new Date(args.object['startDate']);
    const endDate = new Date(value);
    return endDate > startDate;
  }

  defaultMessage(args: ValidationArguments) {
    return 'End date must be greater than start date.';
  }
}

export function isGreaterThanStartDate(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsGreaterThanStartDateConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'increment', async: false })
export class IncrementValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const incrementValue = args.constraints[0];
    if (!Number.isInteger(value) || value <= 0) {
      return false; // Value must be a positive integer
    }
    if (value % incrementValue !== 0) {
      return false; // Value must be in the increment of the provided number
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const incrementValue = args.constraints[0];
    return `The slot duration must be a positive integer and in the increment of ${incrementValue}.`;
  }
}

@ValidatorConstraint({ name: 'timeSlots', async: false })
export class EndTimeValidator implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments) {
    const startTime = args.object['startTime'];
    const slotDuration = args.object['slotDuration'];

    if (!startTime || !slotDuration) {
      return false; // Missing required properties
    }

    const startTimeMinutes = timeToMinutes(startTime);
    const endTimeMinutes = timeToMinutes(endTime);
    const difference = endTimeMinutes - startTimeMinutes;

    if (difference <= 0) {
      return false; // End time must be after start time
    }

    if (difference % slotDuration !== 0) {
      return false; // Difference must be a multiple of slot duration
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'The difference between end time and start time should be a multiple of slot duration.';
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
