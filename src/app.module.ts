import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TimesModule } from './plugins/times/times.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE', 'sqlite') as 'sqlite',
        database: configService.get<string>('DB_NAME', 'data/database.sqlite'),
        entities: ['dist/entities/**/*.entity.js'],
        synchronize: false,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
