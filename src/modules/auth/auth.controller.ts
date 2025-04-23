import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignInDto } from 'src/dto/auth/sign-in.dto';

import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and get refresh and access tokens' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '', // TODO: Add description
    type: Object, // TODO: Add valid type
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credentials do not match any user in the database',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async signIn(@Body() signInDto: SignInDto) {
    const user = await this.authService.validateUser(signInDto);

    return user;
  }
}
