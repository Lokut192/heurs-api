import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSetting } from 'src/entities/user/setting/user-setting.entity';

import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSetting])],
  exports: [UserSettingsService],
  providers: [UserSettingsService],
  controllers: [UserSettingsController],
})
export class UserSettingsModule {}
