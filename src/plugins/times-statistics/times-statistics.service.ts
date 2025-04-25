import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MonthTimesStatistics } from 'src/entities/time/statistics/month-times-statistics.entity';
import { WeekTimesStatistics } from 'src/entities/time/statistics/week-times-statistics.entity';
import { Time } from 'src/entities/time/time.entity';
import { Repository } from 'typeorm';

import { TimesService } from '../times/times.service';
import { TimeType } from '../times/TimeType.enum';

@Injectable()
export class TimesStatisticsService {
  private readonly logger = new Logger(TimesStatisticsService.name);

  constructor(
    @Inject(forwardRef(() => TimesService))
    private readonly timesService: TimesService,
    @InjectRepository(MonthTimesStatistics)
    private readonly monthStatsRepo: Repository<MonthTimesStatistics>,
    @InjectRepository(WeekTimesStatistics)
    private readonly weekStatsRepo: Repository<WeekTimesStatistics>,
    // @InjectRepository(Time)
    // private readonly timesRepo: Repository<Time>,
  ) {}

  // #region Month stats

  async findForMonth(userId: number, month: number, year: number) {
    const stat = await this.monthStatsRepo.findOneBy({
      userId,
      month,
      year,
    });

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
}
