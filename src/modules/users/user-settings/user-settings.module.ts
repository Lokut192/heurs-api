import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeZone } from 'src/entities/time-zone/time-zone.entity';
import { UserSetting } from 'src/entities/user/setting/user-setting.entity';
import { User } from 'src/entities/user/user.entity';

import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSetting, User, TimeZone])],
  exports: [UserSettingsService],
  providers: [UserSettingsService],
  controllers: [UserSettingsController],
})
export class UserSettingsModule {}
