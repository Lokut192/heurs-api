import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user/user.entity';

import { TimesModule } from '../times/times.module';
import { UserSettingsModule } from '../users/user-settings/user-settings.module';
import { UsersModule } from '../users/users.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    UserSettingsModule,
    TimesModule,
  ],
  exports: [MeService],
  providers: [MeService],
  controllers: [MeController],
})
export class MeModule {}
