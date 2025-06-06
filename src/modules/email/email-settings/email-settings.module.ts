import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailSetting } from '../entities/email-setting.entity';
import { EmailSettingsService } from './email-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailSetting])],
  exports: [EmailSettingsService],
  providers: [EmailSettingsService],
})
export class EmailSettingsModule {}
