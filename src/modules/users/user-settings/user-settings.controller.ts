import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { HasProfile } from 'src/decorators/permissions/has-profile.decorator';
import { GetUserSettingDto } from 'src/dto/user/user-settings/get-user-settings.dto';
import { AccessTokenGuard } from 'src/modules/auth/access-token.guard';

import { Profiles } from '../user-profile/profiles.enum';
import { UserSettingTypes } from './user-setting-type.enum';
import { UserSettingsService } from './user-settings.service';

@Controller()
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@ApiTags('User Settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get('/users/id/:id/settings')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiOperation({ summary: 'Get all user settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetUserSettingDto,
    isArray: true,
  })
  @HasProfile(Profiles.Admin)
  async findAllUserSetting(@Param('id', new ParseIntPipe()) idStr: string) {
    const userId = Number(idStr);

    if (Number.isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid id.');
    }

    const settings = await this.userSettingsService.findAllUserSetting(userId);

    return plainToInstance(GetUserSettingDto, settings, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/users/settings/types')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiOperation({ summary: 'Get user settings types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User settings types',
    isArray: true,
  })
  async findAllUserSettingsTypes() {
    return Object.values(UserSettingTypes);
  }
}
