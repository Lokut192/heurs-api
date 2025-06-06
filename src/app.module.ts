import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CronModule } from './modules/cron/cron.module';
import { EmailModule } from './modules/email/email.module';
import { MeModule } from './modules/me/me.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { TimeZoneModule } from './modules/time-zone/time-zone.module';
import { TimesModule } from './modules/times/times.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE', 'postgres') as 'postgres',
        database: configService.get<string>('DB_NAME', 'heurs_api'),
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'heurs_api'),
        password: configService.get<string>('DB_PASSWORD', 'heurs_api'),
        entities: ['dist/entities/**/*.entity.js'],
        synchronize:
          configService.get<string>('NODE_ENV', 'production') !== 'development',
        migrations: ['dist/migrations/*.js'],
        logging:
          configService.get<string>('NODE_ENV', 'production') === 'development'
            ? ['query']
            : false,
      }),
    }),
    UsersModule,
    AuthModule,
    TimesModule,
    MeModule,
    SeederModule,
    TimeZoneModule,
    EmailModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
