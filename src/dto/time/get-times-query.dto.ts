import { Transform } from 'class-transformer';
import { IsIn, IsOptional, Validate } from 'class-validator';
import { Time } from 'src/entities/time/time.entity';
import { IsValidDateString } from 'src/validators/date/is-valid-date-string.validator';

export class GetTimesQueryDto {
  @IsOptional()
  @Validate(IsValidDateString)
  from?: string;

  @IsOptional()
  @Validate(IsValidDateString)
  to?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : 'ASC',
  )
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order: 'ASC' | 'DESC';

  @Transform(({ value }) => (!value ? 'date' : value))
  @IsIn(['date', 'duration'])
  @IsOptional()
  orderby: keyof Time;
}
