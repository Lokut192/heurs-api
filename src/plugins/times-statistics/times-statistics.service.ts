import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MonthTimesStatistics } from 'src/entities/time/statistics/month-times-statistics.entity';
import { Repository } from 'typeorm';

import { TimesService } from '../times/times.service';
import { TimeType } from '../times/TimeType.enum';

@Injectable()
export class TimesStatisticsService {
  constructor(
    @Inject(forwardRef(() => TimesService))
    private readonly timesService: TimesService,
    @InjectRepository(MonthTimesStatistics)
    private readonly monthStatsRepo: Repository<MonthTimesStatistics>,
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
      throw new NotFoundException('Statistics not found.');
    }

    return stat;
  }

  async genUserMonthsStats(userId: number, month: number, year: number) {
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

    const stat = this.monthStatsRepo.create({
      month,
      year,
      user: { id: userId },
      overtimeTimesCount: overtimeStats.count,
      overtimeTotalDuration: overtimeStats.totalDuration,
      timesCount: totalStats.count,
      totalDuration: totalStats.totalDuration,
    });

    await this.monthStatsRepo.save(stat);
  }

  // #endregion Month stats
}
