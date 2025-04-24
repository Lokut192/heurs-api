import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @Expose()
  @ApiProperty({
    example: 'john.doe@me.com',
    description: 'Can be the user email or username',
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @Expose()
  @ApiProperty({ example: 'my-strong-password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
