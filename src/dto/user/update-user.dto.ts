import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: true, example: 1 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ required: true, example: 'john.doe' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ required: true, example: 'john.doe@me.com' })
  @IsEmail()
  email: string;
}
