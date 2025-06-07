import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeZone } from 'src/entities/time-zone/time-zone.entity';

import { TimeZoneController } from './time-zone.controller';
import { TimeZoneService } from './time-zone.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimeZone]), ConfigModule],
  exports: [TimeZoneService],
  providers: [TimeZoneService],
  controllers: [TimeZoneController],
})
export class TimeZoneModule {}
