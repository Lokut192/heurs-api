import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Time } from 'src/entities/time/time.entity';

import { TimesController } from './times.controller';
import { TimesService } from './times.service';

@Module({
  imports: [TypeOrmModule.forFeature([Time])],
  controllers: [TimesController],
  exports: [TimesService],
  providers: [TimesService],
})
export class TimesModule {}
