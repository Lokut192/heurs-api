import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignInDto } from 'src/dto/auth/sign-in.dto';
import { User } from 'src/entities/user/user.entity';
import { UserSession } from 'src/entities/user/user-session.entity';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
  ) {}

  // #region Login

  async validateUser(loginDto: SignInDto) {
    // Check if user exists with the provided login
    let user: User | null = null;

    try {
      user = await this.usersService.findOneByEmail(loginDto.login);
    } catch (_userNotFoundByEmailException) {
      // Do nothing
    }

    if (user === null) {
      try {
        user = await this.usersService.findOneByUsername(loginDto.login);
      } catch (_userNotFoundByUsernameException) {
        // Do nothing
      }
    }

    if (user === null) {
      throw new UnauthorizedException();
    }

    // Get user password
    const userPassword = (await this.usersRepo.findOne({
      where: { id: user.id },
      select: ['password'],
    })) as { password: string } | null;

    if (userPassword === null) {
      throw new UnauthorizedException();
    }

    // Check password match
    const passwordMatch = await UsersService.passwordMatch(
      loginDto.password,
      userPassword.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException();
    }

    return user;
  }

  // #endregion Login

  // #region Session

  // async createUserSession(user: User): Promise<UserSession> {}

  // #endregion Session
}
