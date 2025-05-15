import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({ required: true, example: 'john.doe@me.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true, example: 'john.doe' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._-]{3,}$/, {
    message:
      'Username must be at least 3 characters long and contain only letters, numbers, dots, dashes, and underscores.',
  })
  @Transform(({ value }) => value.trim())
  username: string;

  @ApiProperty({ required: true, example: '57C~9Hdi5|£^' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
