import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
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
  constructor(
    configService: ConfigService,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
  ) {
    const secret = configService.get<string>('JWT_SECRET', 'secret');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenJwtPayload): unknown {
    const refreshToken =
      req.get('Authorization')?.replace('Bearer', '').trim() ?? null;

    if (refreshToken === null) {
      throw new UnauthorizedException('Token invalid or expired');
    }

    // Check if session exists in database
    const session = this.sessionsRepo.findOne({
      where: {
        refreshToken,
        user: { id: payload.userId },
        sessionId: payload.sessionId,
      },
    });
    if (session === null) {
      throw new UnauthorizedException('Token invalid or expired');
    }

    return { ...payload, refreshToken };
  }
}
