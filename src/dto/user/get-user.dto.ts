import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetUserDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'john.doe@me.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: 'john.doe' })
  username: string;
}
