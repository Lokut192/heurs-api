import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerOptions } from '@nestjs-modules/mailer';
import { Repository } from 'typeorm';

import { EmailSetting } from '../entities/email-setting.entity';

@Injectable()
export class EmailSettingsService {
  constructor(
    @InjectRepository(EmailSetting)
    private readonly emailSettingsRepo: Repository<EmailSetting>,
  ) {}

  async getSmtpConfig(): Promise<Partial<MailerOptions>> {
    const config = await this.emailSettingsRepo.findOneByOrFail({
      active: true,
    });

    return {
      transport: {
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      },

      defaults: {
        from: config.defaultFrom,
      },
    };
  }
}
