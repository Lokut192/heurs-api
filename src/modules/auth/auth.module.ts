import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user/user.entity';
import { UserSession } from 'src/entities/user/user-session.entity';

import { UsersModule } from '../users/users.module';
import { AccessTokenStrategy } from './access-token.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenStrategy } from './refresh-token.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET', 'secret'),
        // signOptions: { expiresIn: '1d', algorithm: 'HS256' },
      }),
    }),
    UsersModule,
  ],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
