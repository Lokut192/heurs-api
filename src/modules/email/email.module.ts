import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';

import { EmailService } from './email.service';
import { EmailSettingsModule } from './email-settings/email-settings.module';
import { EmailSettingsService } from './email-settings/email-settings.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [EmailSettingsModule],
      inject: [EmailSettingsService],
      useFactory: async (emailSettingsService: EmailSettingsService) => {
        const config = await emailSettingsService.getSmtpConfig();

        return {
          ...config,

          template: {
            dir: join(process.cwd(), 'src', 'modules', 'email', 'templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
    }),
    EmailSettingsModule,
  ],
  exports: [EmailService],
  providers: [EmailService],
})
export class EmailModule {}
