import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/entities/user/profile/profile.entity';
import { User } from 'src/entities/user/user.entity';
import { DeepPartial, Repository } from 'typeorm';

import { Profiles } from '../users/user-profile/profiles.enum';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async seed() {
    await this.createProfiles();
    await this.createUsers();
  }

  private async createProfiles() {
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
        this.logger.warn(
          `Profile with identifier ${p.identifier} already exists.`,
        );
        continue;
      }

      await this.profilesRepo.save(p);
      this.logger.debug(`Profile ${p.identifier} created.`);
    }

    this.logger.debug('Profiles created.');
  }

  private async createUsers() {
    const users: DeepPartial<User>[] = [];

    for (const user of users) {
      // Check if user already exists by username
      const existingUserUsername = await this.usersRepo.findOneBy({
        username: user.username,
      });

      if (existingUserUsername) {
        this.logger.warn(`User with username ${user.username} already exists`);
        continue;
      }

      // Check if user already exists by email
      const existingUserEmail = await this.usersRepo.findOneBy({
        email: user.email,
      });

      if (existingUserEmail) {
        this.logger.warn(`User with email ${user.email} already exists`);
        continue;
      }

      const dbUser = this.usersRepo.create(user);
      await this.usersRepo.save(dbUser);
    }
  }
}
