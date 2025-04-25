import { IsNumber, IsPositive } from 'class-validator';

export class CreateTimeDto {
  @IsNumber()
  @IsPositive()
  duration: number;
}
