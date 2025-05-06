import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user/user.entity';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async seed() {
    await this.createUsers();
  }

  private async createUsers() {
    const users: DeepPartial<User>[] = [
      {
        email: 'luke.ostermann@gmail.com',
        username: 'luke.ostrmn',
        password: 'SrongPassw0rd$',
      },
      {
        username: 'jikai',
        email: 'jikai.bh@me.com',
        password: 'Drudge7-Quiver0-Multitude2-Heaving2-Crestless7',
      },
      // {
      //   email: 'nathan.baumann@me.com',
      //   username: 'nathan.bmn',
      //   password: 'SrongPassw0rd$',
      // },
    ];

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
