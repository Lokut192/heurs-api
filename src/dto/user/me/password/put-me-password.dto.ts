import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class PutMePasswordDto {
  @ApiProperty({ required: true, example: '57C~9Hdi5|£^' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ required: true, example: '57C~9Hdi5|£^' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  newPassword: string;
}
