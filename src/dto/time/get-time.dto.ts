import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetTimeDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 60 })
  @Expose()
  duration: number;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: string;
}
