import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { SignInDto } from 'src/dto/auth/sign-in.dto';
import { User } from 'src/entities/user/user.entity';
import { UserSession } from 'src/entities/user/user-session.entity';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
  ) {}

  // #region Login

  async signIn(loginDto: SignInDto) {
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

    const refreshToken = await this.getUserRefreshToken(
      user.id,
      user.username,
      user.email,
    );
    const newSession = await this.startSession(user.id, refreshToken);
    const accessToken = await this.getUserAccessToken(
      newSession.sessionId,
      user.id,
      user.username,
      user.email,
    );

    return { refreshToken, accessToken };
  }

  // #endregion Login

  // #region Session

  async startSession(
    userId: number | string,
    refreshToken: string,
  ): Promise<UserSession> {
    this.logger.debug(`Hashing refresh token: ${refreshToken}`);
    const hashedRefreshToken = this.hashData(refreshToken);
    const session = this.sessionsRepo.create({
      refreshToken: hashedRefreshToken,
      user: { id: Number(userId) },
    });

    await this.sessionsRepo.save(session);

    return session;
  }

  async getSessionRefreshToken(refreshToken: string) {
    const hashedRefreshToken = this.hashData(refreshToken);
    const session = await this.sessionsRepo.findOne({
      where: { refreshToken: hashedRefreshToken },
    });

    if (session === null) {
      throw new UnauthorizedException();
    }

    return session;
  }

  // #endregion Session

  // #region Tokens

  async updateRefreshToken(userId: string | number, refreshToken: string) {
    const hashedRefreshToken = this.hashData(refreshToken);
    await this.sessionsRepo.update(
      { user: { id: Number(userId) } },
      { refreshToken: hashedRefreshToken },
    );
  }

  async getUserAccessToken(
    sessionId: string,
    userId: number,
    userUsername: string,
    userEmail: string,
  ) {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'access_secret',
    );

    const accessToken = await this.jwtService.signAsync(
      { sessionId, userId, userUsername, userEmail },
      { secret: accessSecret, expiresIn: '1h', algorithm: 'HS256' },
    );

    return accessToken;
  }

  async getUserRefreshToken(
    userId: number,
    userUsername: string,
    userEmail: string,
  ) {
    const jwtSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'jwt_secret',
    );

    const refreshToken = await this.jwtService.signAsync(
      { userId, userUsername, userEmail },
      { secret: jwtSecret, expiresIn: '7d', algorithm: 'HS256' },
    );

    return refreshToken;
  }

  // #endregion Tokens

  // #region Helpers

  hashData(data: string) {
    return createHash('sha-256').update(data).digest('hex');
  }

  // #endregion Helpers
}
