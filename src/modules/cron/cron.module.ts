import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user/user.entity';

import { TimeZoneModule } from '../time-zone/time-zone.module';
import { TimesModule } from '../times/times.module';
import { CronService } from './cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), TimesModule, TimeZoneModule],
  providers: [CronService],
})
export class CronModule {}
