import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetYearTimesStatsDto {
  @Expose()
  @ApiProperty({ example: 1 })
  overtimeTimesCount: number;

  @Expose()
  @ApiProperty({ example: 120, description: 'Duration in minutes' })
  overtimeTotalDuration: number;

  @Expose()
  @ApiProperty({ example: 1 })
  recoveryTimesCount: number;

  @Expose()
  @ApiProperty({ example: 120, description: 'Duration in minutes' })
  recoveryTotalDuration: number;

  @Expose()
  @ApiProperty({ example: 2 })
  timesCount: number;

  @Expose()
  @ApiProperty({ example: 180, description: 'Duration in minutes' })
  totalDuration: number;

  @Expose()
  @ApiProperty({
    example: 180,
    description: 'Balance from start of the year in minutes',
  })
  balance: number;

  @Expose()
  @ApiProperty({
    example: 180,
    description: 'Average duration in minutes by week',
  })
  weekAvgDuration: number;

  @Expose()
  @ApiProperty({
    example: 180,
    description: 'Average duration in minutes by month',
  })
  monthAvgDuration: number;

  @Expose()
  @ApiProperty({ example: new Date().getFullYear() })
  year: number;

  @Expose()
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: string;
}
