import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthTimesStatistics } from 'src/entities/time/statistics/month-times-statistics.entity';
import { WeekTimesStatistics } from 'src/entities/time/statistics/week-times-statistics.entity';

import { TimesModule } from '../times/times.module';
import { TimesStatisticsController } from './times-statistics.controller';
import { TimesStatisticsService } from './times-statistics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MonthTimesStatistics,
      WeekTimesStatistics,
      // Time,
    ]),
    forwardRef(() => TimesModule),
  ],
  exports: [TimesStatisticsService],
  providers: [TimesStatisticsService],
  controllers: [TimesStatisticsController],
})
export class TimesStatisticsModule {}
