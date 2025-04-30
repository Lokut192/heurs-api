import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // #region READ

  async getMe(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (user === null) {
      throw new UnauthorizedException();
    }

    return user;
  }

  // #endregion READ
}
