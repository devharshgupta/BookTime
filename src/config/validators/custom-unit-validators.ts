import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
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
      if (daysSet.has(weeklyTiming.dayName)) {
        return false; // Duplicate day found
      } else {
        daysSet.add(weeklyTiming.dayName);
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
