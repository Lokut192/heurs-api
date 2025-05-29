import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { LoggedUser } from 'src/decorators/auth/LoggedUser.decorator';
import { GetMeDto } from 'src/dto/user/me/get-me.dto';
import { PutMePasswordDto } from 'src/dto/user/me/password/put-me-password.dto';
import { PutMeDto } from 'src/dto/user/me/put-me.dto';
import { GetUserSettingDto } from 'src/dto/user/user-settings/get-user-settings.dto';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { LoggedUserType } from '../auth/LoggedUser.type';
import { UserSettingsService } from '../users/user-settings/user-settings.service';
import { MeService } from './me.service';

@Controller('me')
@ApiBearerAuth()
@ApiTags('Me')
@UseGuards(AccessTokenGuard)
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly userSettingsService: UserSettingsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user data',
    type: String,
    isArray: false,
  })
  async getMe(@LoggedUser() loggedUser: LoggedUserType) {
    const me = await this.meService.getMe(loggedUser.userId);

    return plainToInstance(GetMeDto, me, { excludeExtraneousValues: true });
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user data',
    type: String,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or username already in use',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not allowed to update current user',
  })
  async updateMe(
    @LoggedUser() loggedUser: LoggedUserType,
    @Body() meDto: PutMeDto,
  ) {
    const me = await this.meService.updateMe(loggedUser.userId, meDto);

    return plainToInstance(GetMeDto, me, { excludeExtraneousValues: true });
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password successfully updated',
    type: String,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Old password does not match',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'New password is not strong enough',
  })
  async updateMePassword(
    @LoggedUser() loggedUser: LoggedUserType,
    @Body() mePasswordDto: PutMePasswordDto,
  ) {
    await this.meService.updateMePassword(loggedUser.userId, mePasswordDto);

    return;
  }

  // #region Settings

  @Get('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user settings',
    type: GetUserSettingDto,
    isArray: true,
  })
  async getMySettings(@LoggedUser() loggedUser: LoggedUserType) {
    const settings = await this.userSettingsService.findAllUserSetting(
      loggedUser.userId,
    );

    return plainToInstance(GetUserSettingDto, settings, {
      excludeExtraneousValues: true,
    });
  }

  // #endregion Settings
}
