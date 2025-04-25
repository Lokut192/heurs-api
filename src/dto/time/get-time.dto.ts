import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TimeType } from 'src/plugins/times/TimeType.enum';

export class GetTimeDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 60 })
  @Expose()
  duration: number;

  @ApiProperty({ example: TimeType.Overtime })
  @Expose()
  type: TimeType;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @Expose()
  date: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: string;
}
