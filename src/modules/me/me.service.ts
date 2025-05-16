import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PutMePasswordDto } from 'src/dto/user/me/password/put-me-password.dto';
import { PutMeDto } from 'src/dto/user/me/put-me.dto';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  // #region READ

  async getMe(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (user === null) {
      throw new ForbiddenException();
    }

    return user;
  }

  // #endregion READ

  // #region UPDATE

  async updateMe(userId: number, mePayload: PutMeDto) {
    try {
      await this.usersService.updateOne({ id: userId, ...mePayload });
    } catch (exception) {
      if (exception instanceof ConflictException) {
        throw exception;
      }

      if (exception instanceof NotFoundException) {
        throw new ForbiddenException();
      }
    }

    return this.getMe(userId);
  }

  async updateMePassword(userId: number, payload: PutMePasswordDto) {
    const userPassword = (await this.usersRepo.findOne({
      where: { id: userId },
      select: ['password'],
    })) as { password: string } | null;

    if (userPassword === null) {
      throw new ForbiddenException();
    }

    const passwordMatch = await UsersService.passwordMatch(
      payload.oldPassword,
      userPassword.password,
    );

    if (!passwordMatch) {
      throw new ForbiddenException();
    }

    await this.usersRepo.update(
      { id: userId },
      { password: UsersService.hashPassword(payload.newPassword) },
    );
  }

  // #endregion UPDATE
}
