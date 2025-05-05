import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateTime } from 'luxon';

@ValidatorConstraint({ name: 'isValidDateString', async: false })
export class IsValidDateString implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    console.log('date value', (value as any) instanceof Date);
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) return false;

    return DateTime.fromISO(value).isValid;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be format yyyy-MM-dd`;
  }
}
