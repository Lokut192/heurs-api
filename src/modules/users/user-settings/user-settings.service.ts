import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSetting } from 'src/entities/user/setting/user-setting.entity';
import { User } from 'src/entities/user/user.entity';
import { DeepPartial, Repository } from 'typeorm';

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
  ];

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSetting)
    private readonly userSettingsRepo: Repository<UserSetting>,
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
      // await this.userSettingsRepo.update(
      //   {
      //     code: setting.code,
      //   },
      //   {
      //     type: setting.type,
      //   },
      // );
      // await this.userSettingsRepo.save(newUsersSettings);
    }
  }

  // #region READ

  findAllUserSetting(userId: number) {
    return this.userSettingsRepo.find({
      where: { user: { id: userId } },
    });
  }

  // #endregion READ
}
