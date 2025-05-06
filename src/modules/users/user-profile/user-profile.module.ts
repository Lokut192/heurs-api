import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/entities/user/profile/profile.entity';

import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  exports: [UserProfileService],
  providers: [UserProfileService],
  controllers: [UserProfileController],
})
export class UserProfileModule {}
