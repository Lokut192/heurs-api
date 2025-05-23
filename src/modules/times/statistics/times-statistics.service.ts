import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { MonthTimesStatistics } from 'src/entities/time/statistics/month-times-statistics.entity';
import { WeekTimesStatistics } from 'src/entities/time/statistics/week-times-statistics.entity';
import { Time } from 'src/entities/time/time.entity';
import { DeepPartial, MoreThan, Repository } from 'typeorm';

import { TimesService } from '../times.service';
import { TimeMutationsSubscriber } from '../times-mutations-subscriber.interface';
import { TimeType } from '../TimeType.enum';

@Injectable()
export class TimesStatisticsService
  implements TimeMutationsSubscriber, OnModuleInit
{
  private readonly logger = new Logger(TimesStatisticsService.name);

  constructor(
    @Inject(forwardRef(() => TimesService))
    private readonly timesService: TimesService,
    @InjectRepository(MonthTimesStatistics)
    private readonly monthStatsRepo: Repository<MonthTimesStatistics>,
    @InjectRepository(WeekTimesStatistics)
    private readonly weekStatsRepo: Repository<WeekTimesStatistics>,
    @InjectRepository(Time)
    private readonly timesRepo: Repository<Time>,
  ) {}

  onModuleInit() {
    this.timesService.subscribeAsyncToMutations(this);
  }

  // #region Month stats

  async findForMonth(userId: number, month: number, year: number) {
    const query = this.monthStatsRepo.createQueryBuilder('stats');

    query.where('stats.user_id = :userId', { userId });
    query.andWhere('stats.month = :month', { month });
    query.andWhere('stats.year = :year', { year });

    const stat = await query.getOne();

    if (stat === null) {
      throw new NotFoundException('Month statistics not found.');
    }

    return stat;
  }

  getMonthBalance(
    userId: number,
    untilMonthNumber: number,
    untilYear: number,
  ): Promise<number> {
    const startDatetime = DateTime.fromObject({
      month: untilMonthNumber,
      year: untilYear,
    }).startOf('year');

    const endDatetime = DateTime.fromObject({
      month: untilMonthNumber,
      year: untilYear,
    })
      .startOf('month')
      .plus({ month: 1 });

    return this.getBalanceForPeriod(
      userId,
      startDatetime.toISODate()!,
      endDatetime.toISODate()!,
    );
  }

  async genUserMonthStats(userId: number, month: number, year: number) {
    const times = await this.timesService.findManyForMonth(userId, month, year);

    // Deleting existing scope stats
    try {
      const existingStats = await this.findForMonth(userId, month, year);

      if (existingStats !== null) {
        await this.monthStatsRepo.remove(existingStats);
      }
    } catch (_notFoundException) {
      // Nothing to do here
    }

    // Get stats
    const [globalStats] = await Promise.all([this.generateStatistics(times)]);

    // Save in database
    const stat = this.monthStatsRepo.create({
      month,
      year,
      user: { id: userId },
      userId,
      ...globalStats,
    });

    await this.monthStatsRepo.save(stat);
  }

  // #endregion Month stats

  // #region Week stats

  async findStatWeek(userId: number, week: number, year: number) {
    const stat = await this.weekStatsRepo.findOneBy({
      userId,
      week,
      year,
    });

    if (stat === null) {
      throw new NotFoundException('Week statistics not found.');
    }

    return stat;
  }

  getWeekBalance(
    userId: number,
    untilWeek: number,
    untilYear: number,
  ): Promise<number> {
    const startDatetime = DateTime.fromObject({
      weekNumber: untilWeek,
      weekYear: untilYear,
    }).startOf('year');

    const endDatetime = DateTime.fromObject({
      weekNumber: untilWeek,
      weekYear: untilYear,
    })
      .startOf('week')
      .plus({ week: 1 });

    return this.getBalanceForPeriod(
      userId,
      startDatetime.toISODate()!,
      endDatetime.toISODate()!,
    );
  }

  async genUserWeekStats(userId: number, week: number, year: number) {
    const times = await this.timesService.findManyForWeek(userId, week, year);

    // Deleting existing scope stats
    try {
      const existingStats = await this.findStatWeek(userId, week, year);

      if (existingStats !== null) {
        await this.weekStatsRepo.remove(existingStats);
      }
    } catch (_notFoundException) {
      // Nothing to do here
    }

    // Get stats
    const [globalStats] = await Promise.all([this.generateStatistics(times)]);

    // Save in database
    const stat = this.weekStatsRepo.create({
      week,
      year,
      user: { id: userId },
      ...globalStats,
    });

    await this.weekStatsRepo.save(stat);
  }

  // #endregion Week stats

  // #region Year stats

  async findStatYear(
    userId: number,
    year: number,
    options: { avgUntil?: string } = {},
  ) {
    const currYear = DateTime.now().year;

    let maxAvgMonthNbr = 12;
    if (options.avgUntil) {
      maxAvgMonthNbr = DateTime.fromISO(options.avgUntil).month;
    } else if (year < currYear) {
      maxAvgMonthNbr = 12;
    } else {
      // If year >= currYear
      maxAvgMonthNbr =
        (
          await this.monthStatsRepo.find({
            select: ['month'],
            where: { userId, year, timesCount: MoreThan(0) },
            take: 1,
            order: { month: 'DESC' },
          })
        )[0].month ?? 1;
    }

    let maxAvgWeekNbr = 52;
    if (options.avgUntil) {
      maxAvgWeekNbr = DateTime.fromISO(options.avgUntil).weekNumber;
    } else if (year < currYear) {
      maxAvgWeekNbr = 52;
    } else {
      // If year >= currYear
      maxAvgWeekNbr =
        (
          await this.weekStatsRepo.find({
            select: ['week'],
            where: { userId, year, timesCount: MoreThan(0) },
            take: 1,
            order: { week: 'DESC' },
          })
        )[0].week ?? 1;
    }

    // Get global stats
    const globalStatsQuery = this.monthStatsRepo.createQueryBuilder('stats');
    globalStatsQuery.select(
      'SUM(stats.overtime_times_count) as overtime_times_count, SUM(stats.overtime_total_duration) as overtime_total_duration, SUM(stats.recovery_times_count) as recovery_times_count, SUM(stats.recovery_total_duration) as recovery_total_duration, SUM(stats.times_count) as times_count, SUM(stats.total_duration) as total_duration',
    );
    globalStatsQuery.where('stats.user_id = :userId', { userId });
    globalStatsQuery.andWhere('stats.year = :year', { year });
    const globalStats = (await globalStatsQuery.getRawOne()) as {
      overtime_times_count: string;
      overtime_total_duration: string;
      recovery_times_count: string;
      recovery_total_duration: string;
      times_count: string;
      total_duration: string;
    };

    // Get week total stats
    const weeksTotalDurationQuery =
      this.weekStatsRepo.createQueryBuilder('stats');
    weeksTotalDurationQuery.select(
      'SUM(stats.total_duration) as total_duration',
    );
    weeksTotalDurationQuery.where('stats.user_id = :userId', { userId });
    weeksTotalDurationQuery.andWhere('stats.week <= :week', {
      week: maxAvgWeekNbr,
    });
    weeksTotalDurationQuery.andWhere('stats.year = :year', { year });
    weeksTotalDurationQuery.andWhere('stats.times_count > 0');
    const weeksTotalDuration = (await weeksTotalDurationQuery.getRawOne()) as {
      total_duration: string;
    };

    // Get month total stats
    const monthsTotalDurationQuery =
      this.monthStatsRepo.createQueryBuilder('stats');
    monthsTotalDurationQuery.select(
      'SUM(stats.total_duration) as total_duration',
    );
    monthsTotalDurationQuery.where('stats.user_id = :userId', { userId });
    monthsTotalDurationQuery.andWhere('stats.month <= :month', {
      month: maxAvgMonthNbr,
    });
    monthsTotalDurationQuery.andWhere('stats.year = :year', { year });
    monthsTotalDurationQuery.andWhere('stats.times_count > 0');
    const monthsTotalDuration =
      (await monthsTotalDurationQuery.getRawOne()) as {
        total_duration: string;
      };

    return {
      overtimeTimesCount: Number(globalStats.overtime_times_count),
      overtimeTotalDuration: Number(globalStats.overtime_total_duration),
      recoveryTimesCount: Number(globalStats.recovery_times_count),
      recoveryTotalDuration: Number(globalStats.recovery_total_duration),
      timesCount: Number(globalStats.times_count),
      totalDuration: Number(globalStats.total_duration),
      user: { id: userId },
      userId,
      updatedAt: DateTime.now().toUTC().toISO(),
      year,
      weekAvgDuration:
        Math.floor(
          (Number(weeksTotalDuration.total_duration) / maxAvgWeekNbr) * 100,
        ) / 100,
      monthAvgDuration:
        Math.floor(
          (Number(monthsTotalDuration.total_duration) / maxAvgMonthNbr) * 100,
        ) / 100,
    } as Omit<DeepPartial<MonthTimesStatistics>, 'month'> & {
      weekAvgDuration: number;
      monthAvgDuration: number;
    };
  }

  async getYearBalance(userId: number, year: number): Promise<number> {
    const startDatetime = DateTime.fromObject({
      year,
    }).startOf('year');

    const endDatetime = DateTime.fromObject({
      year,
    })
      .startOf('year')
      .plus({ year: 1 });

    return this.getBalanceForPeriod(
      userId,
      startDatetime.toISODate()!,
      endDatetime.toISODate()!,
    );
  }

  // #region stats

  // #region Generate

  private async generateStatistics(times: Time[]): Promise<{
    overtimeTimesCount: number;
    overtimeTotalDuration: number;
    recoveryTimesCount: number;
    recoveryTotalDuration: number;
    timesCount: number;
    totalDuration: number;
  }> {
    // Get total stats
    const totalStats = {
      count: times.length,
      totalDuration: times.reduce((acc, time) => {
        switch (time.type) {
          case TimeType.Overtime:
            return acc + time.duration;
          case TimeType.Recovery:
            return acc - time.duration;
          default:
            return acc;
        }
      }, 0),
    };

    // Get overtime stats
    const overtimeStats = {
      count: times.filter((t) => t.type === TimeType.Overtime).length,
      totalDuration: times.reduce((acc, time) => {
        switch (time.type) {
          case TimeType.Overtime:
            return acc + time.duration;
          default:
            return acc;
        }
      }, 0),
    };

    // Get recovery stats
    const recoveryStats = {
      count: times.filter((t) => t.type === TimeType.Recovery).length,
      totalDuration: times.reduce((acc, time) => {
        switch (time.type) {
          case TimeType.Recovery:
            return acc + time.duration;
          default:
            return acc;
        }
      }, 0),
    };

    // Return data
    return {
      overtimeTimesCount: overtimeStats.count,
      overtimeTotalDuration: overtimeStats.totalDuration,
      recoveryTimesCount: recoveryStats.count,
      recoveryTotalDuration: recoveryStats.totalDuration,
      timesCount: totalStats.count,
      totalDuration: totalStats.totalDuration,
    };
  }

  // #endregion Generate

  // #region Balance

  private async getBalanceForPeriod(
    userId: number,
    start: string,
    end: string,
  ) {
    // Build overtime query
    const overtimeQuery = this.timesRepo.createQueryBuilder('time');
    overtimeQuery.select('SUM(time.duration) as duration');
    overtimeQuery.where('time.user_id = :userId', { userId });
    overtimeQuery.andWhere('time.type = :type', { type: TimeType.Overtime });
    overtimeQuery.andWhere('time.date >= :startDate', {
      startDate: start,
    });
    overtimeQuery.andWhere('time.date < :endDate', {
      endDate: end,
    });

    // Build recovery query
    const recoveryQuery = this.timesRepo.createQueryBuilder('time');
    recoveryQuery.select('SUM(time.duration) as duration');
    recoveryQuery.where('time.user_id = :userId', { userId });
    recoveryQuery.andWhere('time.type = :type', { type: TimeType.Recovery });
    recoveryQuery.andWhere('time.date >= :startDate', {
      startDate: start,
    });
    recoveryQuery.andWhere('time.date < :endDate', {
      endDate: end,
    });

    // Get data
    const [overtime, recovery] = await Promise.all([
      overtimeQuery.getRawOne() as Promise<{ duration: number }>,
      recoveryQuery.getRawOne() as Promise<{ duration: number }>,
    ]);

    return overtime.duration - recovery.duration;
  }

  // #endregion Balance

  // #region Time subscriptions

  beforeTimeInsert(
    _time: DeepPartial<Time>,
    _userId: number,
  ): unknown | Promise<unknown> {
    return;
  }

  beforeTimeUpdate(
    _prevTime: DeepPartial<Time>,
    _newTime: DeepPartial<Time>,
    _userId: number,
  ): unknown | Promise<unknown> {
    return;
  }

  beforeTimeDelete(
    _time: DeepPartial<Time>,
    _userId: number,
  ): unknown | Promise<unknown> {
    return;
  }

  beforeTimesDeleteAll(userId: number): unknown | Promise<unknown> {
    void this.monthStatsRepo.update(
      { user: { id: userId } },
      {
        overtimeTimesCount: 0,
        overtimeTotalDuration: 0,
        recoveryTimesCount: 0,
        recoveryTotalDuration: 0,
        timesCount: 0,
        totalDuration: 0,
      },
    );

    void this.weekStatsRepo.update(
      { user: { id: userId } },
      {
        overtimeTimesCount: 0,
        overtimeTotalDuration: 0,
        recoveryTimesCount: 0,
        recoveryTotalDuration: 0,
        timesCount: 0,
        totalDuration: 0,
      },
    );

    return;
  }

  async afterTimeInsert(
    time: DeepPartial<Time>,
    userId: number,
  ): Promise<unknown> {
    // Check on time data
    if (!time.date) {
      const dbTime = await this.timesRepo
        .createQueryBuilder('time')
        .where('time.id = :id', { id: time.id })
        .andWhere('time.user_id = :userId', { userId })
        // .leftJoinAndSelect('time.user', 'user')
        .getOne();

      if (dbTime === null) {
        this.logger.error(`Could not find time with id ${time.id}.`);
        return;
      }

      time.date = dbTime.date;
      time.user = { id: userId };
    }

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Generating stats after time insertion...');
    }

    // Extract date
    const datetime = DateTime.fromISO(time.date);

    void this.genUserMonthStats(userId, datetime.month, datetime.year);
    void this.genUserWeekStats(userId, datetime.weekNumber, datetime.weekYear);

    return;
  }

  afterTimeUpdate(
    prevTime: DeepPartial<Time>,
    newTime: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown> {
    if (!prevTime.date || !newTime.date) {
      this.logger.error(
        'Date is missing in time update for prevTime or newTime.',
      );
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Generating stats after time update for new time...');
    }

    // Extract dates
    const prevDateTime = DateTime.fromISO(prevTime.date);
    const newDateTime = DateTime.fromISO(newTime.date);

    void this.genUserMonthStats(userId, newDateTime.month, newDateTime.year);
    void this.genUserWeekStats(
      userId,
      newDateTime.weekNumber,
      newDateTime.weekYear,
    );

    // Update previous month and week if necessary
    if (
      prevDateTime.month !== newDateTime.month ||
      prevDateTime.year !== newDateTime.year
    ) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          'Generating stats after time update for previous time month...',
        );
      }

      void this.genUserMonthStats(
        userId,
        prevDateTime.month,
        prevDateTime.year,
      );
    }
    if (
      prevDateTime.weekNumber !== newDateTime.weekNumber ||
      prevDateTime.weekYear !== newDateTime.weekYear
    ) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          'Generating stats after time update for previous time week...',
        );
      }

      void this.genUserWeekStats(
        userId,
        prevDateTime.weekNumber,
        prevDateTime.weekYear,
      );
    }

    return;
  }

  afterTimeDelete(
    time: DeepPartial<Time>,
    userId: number,
  ): unknown | Promise<unknown> {
    if (!time.date) {
      this.logger.error('Date is missing in time delete.');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Recalculating stats after time deletion...');
    }

    // Extract date
    const datetime = DateTime.fromISO(time.date);

    void this.genUserMonthStats(userId, datetime.month, datetime.year);
    void this.genUserWeekStats(userId, datetime.weekNumber, datetime.weekYear);

    return;
  }

  afterTimesDeleteAll(_userId: number): unknown | Promise<unknown> {
    return;
  }

  // #endregion Time subscriptions
}
