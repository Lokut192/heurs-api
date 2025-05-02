import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
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

import { AccessTokenGuard } from '../auth/access-token.guard';
import { LoggedUserType } from '../auth/LoggedUser.type';
import { MeService } from './me.service';

@Controller('me')
@ApiBearerAuth()
@ApiTags('Me')
@UseGuards(AccessTokenGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

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
}
