import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { jwtDecode } from 'jwt-decode';
import { DateTime } from 'luxon';
import { SignInDto } from 'src/dto/auth/sign-in.dto';
import { SignUpDto } from 'src/dto/auth/sign-up.dto';
import { User } from 'src/entities/user/user.entity';
import { UserSession } from 'src/entities/user/user-session.entity';
import { Repository } from 'typeorm';

import { Profiles } from '../users/user-profile/profiles.enum';
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

  // #region Sign Up

  async signUp(signUpDto: SignUpDto) {
    const user = await this.usersService.createOne({
      email: signUpDto.email,
      username: signUpDto.username,
      password: signUpDto.password,
    });

    const userProfiles = await this.usersService.findUserProfiles(user.id);

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
      userProfiles.map(
        (profile) => profile.identifier,
      ) as unknown as Profiles[],
    );

    return {
      username: user.username,
      email: user.email,
      refreshToken,
      accessToken,
    };
  }

  // #endregion Sign Up

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

    // Get user with profiles
    const userProfiles = await this.usersService.findUserProfiles(user.id);

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
      userProfiles.map(
        (profile) => profile.identifier,
      ) as unknown as Profiles[],
    );

    return { refreshToken, accessToken };
  }

  // #endregion Login

  // #region Session

  async startSession(
    userId: number | string,
    refreshToken: string,
  ): Promise<UserSession> {
    const parsedRefreshToken = jwtDecode(refreshToken);
    let expiresAt: Date | null = null;
    if (typeof parsedRefreshToken.exp === 'number') {
      expiresAt = DateTime.fromJSDate(new Date(parsedRefreshToken.exp * 1000))
        .toUTC()
        .toJSDate();
    }

    const hashedRefreshToken = this.hashData(refreshToken);
    const session = this.sessionsRepo.create({
      refreshTokenHash: hashedRefreshToken,
      user: { id: Number(userId) },
      expiresAt: expiresAt ?? undefined,
    });

    await this.sessionsRepo.save(session);

    return session;
  }

  async getSessionRefreshToken(refreshToken: string) {
    const hashedRefreshToken = this.hashData(refreshToken);
    const session = await this.sessionsRepo.findOne({
      where: { refreshTokenHash: hashedRefreshToken },
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
      { refreshTokenHash: hashedRefreshToken },
    );
  }

  async getUserAccessToken(
    sessionId: string,
    userId: number,
    userUsername: string,
    userEmail: string,
    userProfiles: Profiles[],
  ) {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'access_secret',
    );

    const accessToken = await this.jwtService.signAsync(
      { sessionId, userId, userUsername, userEmail, userProfiles },
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
