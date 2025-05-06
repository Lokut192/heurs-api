import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { DateTime } from 'luxon';
import { LoggedUser } from 'src/decorators/auth/LoggedUser.decorator';
import { GetMonthTimesStatsDto } from 'src/dto/time/statistics/month/get-month-stats.dto';
import { MonthTimesStatistics } from 'src/entities/time/statistics/month-times-statistics.entity';
import { AccessTokenGuard } from 'src/modules/auth/access-token.guard';
import { LoggedUserType } from 'src/modules/auth/LoggedUser.type';
import { DeepPartial } from 'typeorm';

import { TimesStatisticsService } from './times-statistics.service';

@Controller('times/statistics')
@ApiBearerAuth()
@ApiTags('Times statistics')
@UseGuards(AccessTokenGuard)
export class TimesStatisticsController {
  constructor(private readonly timesStatsService: TimesStatisticsService) {}

  // #region Read

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

    try {
      const stat = await this.timesStatsService.findForMonth(
        loggedUser.userId,
        month,
        year,
      );

      return plainToInstance(GetMonthTimesStatsDto, stat, {
        excludeExtraneousValues: true,
      });
    } catch (_statsNotFoundException) {
      const defaultStats: DeepPartial<MonthTimesStatistics> = {
        month,
        year,
        userId: loggedUser.userId,
        overtimeTimesCount: 0,
        overtimeTotalDuration: 0,
        timesCount: 0,
        totalDuration: 0,
        updatedAt: DateTime.now().toUTC().toISO(),
      };

      return plainToInstance(GetMonthTimesStatsDto, defaultStats, {
        excludeExtraneousValues: true,
      });
    }
  }

  // #endregion Read

  // #region Generate

  @Post('generate/for/month/:month/:year')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Generate current logged user stat for provided month in the provided year',
  })
  async genMonthStat(
    @LoggedUser() loggedUser: LoggedUserType,
    @Param('month', new ParseIntPipe()) strMonth: string,
    @Param('year', new ParseIntPipe()) strYear: string,
  ) {
    const month = Number(strMonth);
    const year = Number(strYear);

    if (!DateTime.fromObject({ month, year }).isValid) {
      throw new BadRequestException('Invalid month-year pair.');
    }

    void this.timesStatsService.genUserMonthStats(
      loggedUser.userId,
      month,
      year,
    );
  }

  @Post('generate/for/week/:week/:year')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Generate current logged user stat for provided week in the provided year',
  })
  async genWeekStat(
    @LoggedUser() loggedUser: LoggedUserType,
    @Param('week', new ParseIntPipe()) strMonth: string,
    @Param('year', new ParseIntPipe()) strYear: string,
  ) {
    const weekNumber = Number(strMonth);
    const year = Number(strYear);

    if (!DateTime.fromObject({ weekNumber, weekYear: year }).isValid) {
      throw new BadRequestException('Invalid week-year pair.');
    }

    void this.timesStatsService.genUserWeekStats(
      loggedUser.userId,
      weekNumber,
      year,
    );
  }

  // #endregion Generate
}
