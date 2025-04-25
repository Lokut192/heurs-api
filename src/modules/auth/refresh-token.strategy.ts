import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserSession } from 'src/entities/user/user-session.entity';
import { Repository } from 'typeorm';

import { AccessTokenJwtPayload } from './access-token.strategy';

export type RefreshTokenJwtPayload = AccessTokenJwtPayload;

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(RefreshTokenStrategy.name);

  constructor(
    configService: ConfigService,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
  ) {
    const secret = configService.get<string>(
      'JWT_REFRESH_SECRET',
      'jwt_secret',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: RefreshTokenJwtPayload,
  ): Promise<unknown> {
    const bearerRegex = /^Bearer\s(\S*)$/;
    const refreshToken =
      req.get('Authorization')?.match(bearerRegex)?.[1] ?? null;

    if (refreshToken === null) {
      throw new UnauthorizedException('Token invalid or expired.');
    }
    const hashedToken = createHash('sha-256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.sessionsRepo.findOne({
      where: { refreshTokenHash: hashedToken },
    });

    if (session === null) {
      throw new UnauthorizedException('Session expired.');
    }

    return { ...payload, refreshToken };
  }
}
