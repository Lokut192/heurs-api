import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetTimeDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 60 })
  @Expose()
  duration: number;

  @Expose()
  createdAt: string;
}
