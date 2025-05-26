import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSetting } from 'src/entities/user/setting/user-setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private readonly userSettingsRepo: Repository<UserSetting>,
  ) {}

  // #region READ

  findAllUserSetting(userId: number) {
    return this.userSettingsRepo.find({
      where: { user: { id: userId } },
    });
  }

  // #endregion READ
}
