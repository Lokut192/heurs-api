import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNumber, IsPositive } from 'class-validator';
import { TimeType } from 'src/modules/times/TimeType.enum';

export class PutTimeDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    required: true,
    example: 1,
  })
  id: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty({
    required: true,
    example: 60,
    description: 'Duration in minutes',
  })
  duration: number;

  @IsEnum(TimeType)
  @ApiProperty({ example: TimeType.Overtime })
  type: TimeType;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Time date in format yyyy-MM-dd',
  })
  @IsISO8601({ strict: true })
  date: string;
}
