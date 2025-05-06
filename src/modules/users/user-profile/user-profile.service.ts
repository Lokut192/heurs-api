import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/entities/user/profile/profile.entity';
import { DeepPartial, Repository } from 'typeorm';

import { Profiles } from './profiles.enum';

@Injectable()
export class UserProfileService implements OnModuleInit {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async onModuleInit() {
    await this.seedProfiles();
  }

  private async seedProfiles() {
    this.logger.debug('Creating profiles...');

    const profiles: DeepPartial<Profile>[] = [
      {
        name: 'Admin',
        identifier: Profiles.Admin,
        level: 1,
      },
      {
        name: 'User',
        identifier: Profiles.User,
        level: 10,
      },
    ];

    for (const p of profiles) {
      const existingProfile = await this.profilesRepo.findOneBy({
        identifier: p.identifier,
      });

      if (existingProfile) {
        if (process.env.NODE_ENV === 'development') {
          this.logger.warn(
            `Profile with identifier ${p.identifier} already exists.`,
          );
        }
        continue;
      }

      await this.profilesRepo.save(p);

      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Profile ${p.identifier} created.`);
      }
    }

    this.logger.debug('Profiles created.');
  }
}
