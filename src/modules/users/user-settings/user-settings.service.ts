import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TimeZone } from 'src/entities/time-zone/time-zone.entity';
import { UserSetting } from 'src/entities/user/setting/user-setting.entity';
import { User } from 'src/entities/user/user.entity';
import { DeepPartial, Repository } from 'typeorm';
import { z } from 'zod/v4';

import { UserSettingTypes } from './user-setting-type.enum';

@Injectable()
export class UserSettingsService implements OnModuleInit {
  private readonly logger = new Logger(UserSettingsService.name);

  private readonly settings: DeepPartial<
    UserSetting & { defaultValue: UserSetting['value'] }
  >[] = [
    {
      code: 'TIME_ZONE',
      defaultValue: 'Europe/Paris',
      type: UserSettingTypes.TimeZoneName,
    },
    {
      code: 'MONTHLY_TIMES_STATS_EMAIL',
      defaultValue: '1',
      type: UserSettingTypes.Boolean,
    },
    {
      code: 'WEEKLY_TIMES_STATS_EMAIL',
      defaultValue: '1',
      type: UserSettingTypes.Boolean,
    },
  ];

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSetting)
    private readonly userSettingsRepo: Repository<UserSetting>,
    @InjectRepository(TimeZone)
    private readonly timeZonesRepo: Repository<TimeZone>,
  ) {}

  async onModuleInit() {
    for (const [_index, setting] of this.settings.entries()) {
      const query = this.usersRepo.createQueryBuilder('user');

      query.where(
        'user.id NOT IN (SELECT user_id FROM "user_settings" "setting" WHERE "setting"."code" = :code)',
        { code: setting.code },
      );

      query.select(['user.id', 'user.username']);

      const users = (await query.getMany()) as {
        id: number;
        username: string;
      }[];

      const newUsersSettings: UserSetting[] = [];
      for (const user of users) {
        this.logger.log(
          `Creating setting ${setting.code} for user ${user.username}`,
        );

        newUsersSettings.push(
          this.userSettingsRepo.create({
            code: setting.code,
            value: setting.defaultValue,
            type: setting.type,
            user: { id: user.id },
          }),
        );
      }

      await Promise.all([
        this.userSettingsRepo.update(
          {
            code: setting.code,
          },
          {
            type: setting.type,
          },
        ),
        this.userSettingsRepo.save(newUsersSettings),
      ]);
    }
  }

  // #region READ

  hasOneByCode(userId: number, code: string): Promise<boolean> {
    return this.userSettingsRepo.existsBy({
      user: { id: userId },
      code,
    });
  }

  async findOneByCode(userId: number, code: string) {
    const setting = await this.userSettingsRepo.findOneBy({
      user: { id: userId },
      code,
    });

    if (setting === null) {
      throw new NotFoundException();
    }

    return setting;
  }

  findAllUserSetting(userId: number) {
    return this.userSettingsRepo.find({
      where: { user: { id: userId } },
    });
  }

  // #endregion READ

  // #region UPDATE

  async updateOneByCode(userId: number, code: string, value: string) {
    const setting = await this.userSettingsRepo.findOneBy({
      user: { id: userId },
      code,
    });

    if (setting === null) {
      throw new BadRequestException('Unknown user setting.');
    }

    switch (setting.type) {
      case UserSettingTypes.TimeZoneName:
        // eslint-disable-next-line no-case-declarations
        const timeZoneExists = await this.timeZonesRepo.existsBy({
          name: value,
        });

        if (!timeZoneExists) {
          throw new BadRequestException('Unknown time zone name.');
        }

        setting.value = value;
        break;
      case UserSettingTypes.Number:
        // eslint-disable-next-line no-case-declarations
        const nbrValue = Number(value);

        if (Number.isNaN(nbrValue)) {
          throw new BadRequestException('Invalid value.');
        }

        setting.value = nbrValue.toString();
        break;
      case UserSettingTypes.Boolean:
        // eslint-disable-next-line no-case-declarations
        const boolValue = z.stringbool().safeParse(value);

        if (!boolValue.success) {
          throw new BadRequestException('Invalid value.');
        }

        setting.value = boolValue.data ? '1' : '0';
        break;
      case UserSettingTypes.Text:
      default:
        setting.value = value;
        break;
    }

    await this.userSettingsRepo.save(setting);

    return this.findOneByCode(userId, code);
  }

  // #endregion UPDATE
}
