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
import { DeepPartial, Repository } from 'typeorm';

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

  async genUserMonthStats(userId: number, month: number, year: number) {
    const times = await this.timesService.findManyForMonth(userId, month, year);

    if (times.length === 0) {
      return;
    }

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
    const stats = await this.generateStatistics(times);

    // Save in database
    const stat = this.monthStatsRepo.create({
      month,
      year,
      user: { id: userId },
      userId,
      ...stats,
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

  async genUserWeekStats(userId: number, week: number, year: number) {
    const times = await this.timesService.findManyForWeek(userId, week, year);

    if (times.length === 0) {
      return;
    }

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
    const stats = await this.generateStatistics(times);

    // Save in database
    const stat = this.weekStatsRepo.create({
      week,
      year,
      user: { id: userId },
      ...stats,
    });

    await this.weekStatsRepo.save(stat);
  }

  // #endregion Week stats

  // #region Generate

  private async generateStatistics(times: Time[]): Promise<{
    overtimeTimesCount: number;
    overtimeTotalDuration: number;
    timesCount: number;
    totalDuration: number;
  }> {
    // Get total stats
    const totalStats = {
      count: times.length,
      totalDuration: times.reduce((acc, time) => {
        switch (time.type as TimeType) {
          case TimeType.Overtime:
            return acc + time.duration;
          default:
            return acc;
        }
      }, 0),
    };

    // Get overtime stats
    const overtimeStats = {
      count: times.filter((t) => (t.type as TimeType) === TimeType.Overtime)
        .length,
      totalDuration: times.reduce((acc, time) => {
        switch (time.type as TimeType) {
          case TimeType.Overtime:
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
      timesCount: totalStats.count,
      totalDuration: totalStats.totalDuration,
    };
  }

  // #endregion Generate

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
        timesCount: 0,
        totalDuration: 0,
      },
    );

    void this.weekStatsRepo.update(
      { user: { id: userId } },
      {
        overtimeTimesCount: 0,
        overtimeTotalDuration: 0,
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
