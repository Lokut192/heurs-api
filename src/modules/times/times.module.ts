import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Time } from 'src/entities/time/time.entity';

import { TimesStatisticsModule } from './statistics/times-statistics.module';
import { TimesController } from './times.controller';
import { TimesService } from './times.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Time]),
    forwardRef(() => TimesStatisticsModule),
  ],
  controllers: [TimesController],
  exports: [TimesService, TimesStatisticsModule],
  providers: [TimesService],
})
export class TimesModule {}
