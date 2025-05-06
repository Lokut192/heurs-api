import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { GetMonthTimesStatsDto } from 'src/dto/time/statistics/month/get-month-stats.dto';
import { AccessTokenGuard } from 'src/modules/auth/access-token.guard';
import { LoggedUserType } from 'src/modules/auth/LoggedUser.type';

import { TimesStatisticsService } from './times-statistics.service';

@Controller('times/statistics')
@ApiBearerAuth()
@ApiTags('Times statistics')
@UseGuards(AccessTokenGuard)
export class TimesStatisticsController {
  constructor(private readonly timesStatsService: TimesStatisticsService) {}

  @Get('for/month/:month/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get current logged user stat for provided month in the provided year',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetMonthTimesStatsDto,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No stat found for the provided month-year pair',
  })
  async getMonthStat(
    @LoggedUser() loggedUser: LoggedUserType,
    @Param('month', new ParseIntPipe()) strMonth: string,
    @Param('year', new ParseIntPipe()) strYear: string,
  ) {
    const month = Number(strMonth);
    const year = Number(strYear);

    if (Number.isNaN(month) || month <= 0 || month > 12) {
      throw new BadRequestException('Invalid month number.');
    }

    if (Number.isNaN(year) || year <= 0) {
      throw new BadRequestException('Invalid year number.');
    }

    const stat = await this.timesStatsService.findForMonth(
      loggedUser.userId,
      month,
      year,
    );

    return plainToInstance(GetMonthTimesStatsDto, stat, {
      excludeExtraneousValues: true,
    });
  }
}
