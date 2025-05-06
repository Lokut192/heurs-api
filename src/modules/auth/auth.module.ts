import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/entities/user/profile/profile.entity';
import { User } from 'src/entities/user/user.entity';
import { UserSession } from 'src/entities/user/user-session.entity';

import { UsersModule } from '../users/users.module';
import { AccessTokenStrategy } from './access-token.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenStrategy } from './refresh-token.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, Profile]),
    JwtModule.register({}),
    UsersModule,
  ],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
