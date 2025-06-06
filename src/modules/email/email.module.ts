import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';

import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST', 'smtp.example.com'),
          port: configService.get<number>('SMTP_PORT', 587),
          secure: false,
          auth: {
            user: configService.get<string>('SMTP_USER', 'heurs_api'),
            pass: configService.get<string>('SMTP_PASSWORD', 'heurs_api'),
          },
        },

        defaults: {
          from: configService.get<string>(
            'EMAIL_DEFAULT_FROM',
            '"No Reply" <no-reply@heurs_api.com>',
          ),
        },

        template: {
          dir: join(process.cwd(), 'src', 'modules', 'email', 'templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
  exports: [EmailService],
  providers: [EmailService],
})
export class EmailModule {}
