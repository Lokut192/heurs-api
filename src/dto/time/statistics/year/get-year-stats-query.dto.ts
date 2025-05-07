import { IsOptional, Validate } from 'class-validator';
import { IsValidDateString } from 'src/validators/date/is-valid-date-string.validator';

export class GetYearStatsQueryDto {
  @IsOptional()
  @Validate(IsValidDateString)
  avgUntil?: string;
}
