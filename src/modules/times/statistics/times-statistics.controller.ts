import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
import { DateTime } from 'luxon';
import { LoggedUser } from 'src/decorators/auth/LoggedUser.decorator';
import { GetMonthTimesStatsDto } from 'src/dto/time/statistics/month/get-month-stats.dto';
import { GetYearTimesStatsDto } from 'src/dto/time/statistics/year/get-year-stats.dto';
import { GetYearStatsQueryDto } from 'src/dto/time/statistics/year/get-year-stats-query.dto';
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
      const [globalStats, balance] = await Promise.all([
        this.timesStatsService.findForMonth(loggedUser.userId, month, year),
        this.timesStatsService.getMonthBalance(loggedUser.userId, month, year),
      ]);

      return plainToInstance(
        GetMonthTimesStatsDto,
        { ...globalStats, balance },
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (_statsNotFoundException) {
      const defaultStats: DeepPartial<GetMonthTimesStatsDto> = {
        month,
        year,
        overtimeTimesCount: 0,
        overtimeTotalDuration: 0,
        recoveryTimesCount: 0,
        recoveryTotalDuration: 0,
        timesCount: 0,
        totalDuration: 0,
        balance: 0,
        updatedAt: DateTime.now().toUTC().toISO(),
      };

      return plainToInstance(GetMonthTimesStatsDto, defaultStats, {
        excludeExtraneousValues: true,
      });
    }
  }

  @Get('for/year/:year')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current logged user stat for provided year',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetYearTimesStatsDto,
    isArray: false,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No stat found for the provided month-year pair',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )
  async getYearStat(
    @LoggedUser() loggedUser: LoggedUserType,
    @Param('year', new ParseIntPipe()) strYear: string,
    @Query() query: GetYearStatsQueryDto,
  ) {
    const year = Number(strYear);

    if (Number.isNaN(year) || year <= 0) {
      throw new BadRequestException('Invalid year number.');
    }

    if (
      typeof query.avgUntil === 'string' &&
      DateTime.fromISO(query.avgUntil).year !== year
    ) {
      throw new BadRequestException('Until date year must match year.');
    }

    try {
      const [globalStats, balance] = await Promise.all([
        this.timesStatsService.findStatYear(loggedUser.userId, year, query),
        this.timesStatsService.getYearBalance(loggedUser.userId, year), // TODO: Add query support
      ]);

      return plainToInstance(
        GetYearTimesStatsDto,
        { ...globalStats, balance },
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (_statsNotFoundException) {
      const defaultStats: GetYearTimesStatsDto = {
        year,
        overtimeTimesCount: 0,
        overtimeTotalDuration: 0,
        timesCount: 0,
        totalDuration: 0,
        balance: 0,
        weekAvgDuration: 0,
        monthAvgDuration: 0,
        recoveryTimesCount: 0,
        recoveryTotalDuration: 0,
        updatedAt: DateTime.now().toUTC().toISO(),
      };

      return plainToInstance(GetYearTimesStatsDto, defaultStats, {
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
