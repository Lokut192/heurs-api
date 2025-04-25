import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { SignInDto } from 'src/dto/auth/sign-in.dto';
import { SignUpDto } from 'src/dto/auth/sign-up.dto';
import { SignUpContentDto } from 'src/dto/auth/sign-up-content.dto';
import { AuthTokensDto } from 'src/dto/auth/tokens.dto';

import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './refresh-token.guard';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign up and get refresh and access tokens' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user tokens',
    type: SignUpContentDto,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or username already in use',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async signUp(@Body() signUpDto: SignUpDto): Promise<SignUpContentDto> {
    const payload = await this.authService.signUp(signUpDto);

    return payload;
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and get refresh and access tokens' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user tokens',
    type: AuthTokensDto,
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
    const tokens = await this.authService.signIn(signInDto);

    return tokens;
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({
    summary: 'Refresh user accessToken and extend session',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user tokens',
    type: AuthTokensDto,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token invalid or expired',
  })
  @ApiBearerAuth()
  async refresh(@Req() req: Request) {
    try {
      const session = await this.authService.getSessionRefreshToken(
        // @ts-ignore
        req.user!.refreshToken! as string,
      );

      const accessToken = await this.authService.getUserAccessToken(
        session.sessionId,
        // @ts-ignore
        req.user!.userId! as number,
        // @ts-ignore
        req.user!.userUsername! as string,
        // @ts-ignore
        req.user!.userEmail! as string,
      );

      return { accessToken };
    } catch (_internalServerErrorException) {
      throw new UnauthorizedException();
    }
  }
}
