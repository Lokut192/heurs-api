import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SignInDto {
  @Expose()
  @ApiProperty({ examples: ['john.doe@me.com', 'john.doe'] })
  login: string;

  @Expose()
  @ApiProperty({ example: 'my-strong-password' })
  password: string;
}
