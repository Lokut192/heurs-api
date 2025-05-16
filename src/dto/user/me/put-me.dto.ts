import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class PutMeDto {
  @Expose()
  @ApiProperty({ example: 'john.doe@me.com' })
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
}
