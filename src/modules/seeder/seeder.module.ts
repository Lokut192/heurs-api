import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user/user.entity';

import { SeederService } from './seeder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
        synchronize: false,
        logging:
          configService.get<string>('NODE_ENV', 'production') === 'development'
            ? ['query']
            : false,
      }),
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [SeederService],
})
export class SeederModule {}
