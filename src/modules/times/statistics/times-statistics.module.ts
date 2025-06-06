import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthTimesStatistics } from 'src/entities/time/statistics/month-times-statistics.entity';
import { WeekTimesStatistics } from 'src/entities/time/statistics/week-times-statistics.entity';
import { Time } from 'src/entities/time/time.entity';
import { EmailModule } from 'src/modules/email/email.module';
import { UsersModule } from 'src/modules/users/users.module';

import { TimesModule } from '../times.module';
import { TimesStatisticsController } from './times-statistics.controller';
import { TimesStatisticsService } from './times-statistics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthTimesStatistics, WeekTimesStatistics, Time]),
    forwardRef(() => UsersModule),
    forwardRef(() => TimesModule),
    EmailModule,
  ],
  exports: [TimesStatisticsService],
  providers: [TimesStatisticsService],
  controllers: [TimesStatisticsController],
})
export class TimesStatisticsModule {}
