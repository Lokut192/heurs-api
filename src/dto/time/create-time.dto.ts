import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { TimeType } from 'src/plugins/times/TimeType.enum';

export class CreateTimeDto {
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
}
