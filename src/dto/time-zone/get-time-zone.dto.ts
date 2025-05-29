import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetTimeZoneDto {
  @Expose()
  @ApiProperty({ description: 'Time zone name', example: 'Europe/Paris' })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Time zone offset in minutes from UTC',
    example: 120,
  })
  offset: number;
}
