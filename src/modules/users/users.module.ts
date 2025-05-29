import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/entities/user/profile/profile.entity';
import { User } from 'src/entities/user/user.entity';

import { UserProfileModule } from './user-profile/user-profile.module';
import { UserSettingsModule } from './user-settings/user-settings.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    UserProfileModule,
    UserSettingsModule,
  ],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
