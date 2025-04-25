import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class CreateTimeDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    required: true,
    example: 60,
    description: 'Duration in minutes',
  })
  duration: number;
}
