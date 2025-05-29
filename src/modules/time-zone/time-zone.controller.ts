import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { GetTimeZoneDto } from 'src/dto/time-zone/get-time-zone.dto';
import { TimeZone } from 'src/entities/time-zone/time-zone.entity';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { TimeZoneService } from './time-zone.service';

@Controller('timezone')
@UseGuards(AccessTokenGuard)
@ApiTags('Time zones')
@ApiBearerAuth()
export class TimeZoneController {
  constructor(private readonly timeZoneService: TimeZoneService) {}

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of time zones and their offsets from UTC.',
    type: GetTimeZoneDto,
    isArray: true,
  })
  async getTimeZoneList(
    @Query('orderby') orderby: keyof TimeZone,
    @Query('order') order: 'ASC' | 'DESC',
  ) {
    const timeZones = await this.timeZoneService.findAll({
      orderBy: orderby,
      order,
    });

    return plainToInstance(GetTimeZoneDto, timeZones, {
      excludeExtraneousValues: true,
    });
  }
}
