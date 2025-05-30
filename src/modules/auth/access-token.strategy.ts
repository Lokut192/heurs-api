import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Profiles } from '../users/user-profile/profiles.enum';

export type AccessTokenJwtPayload = {
  sessionId: string;
  userId: number;
  userUsername: string;
  userEmail: string;
  userProfiles: Profiles[];
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>(
      'JWT_ACCESS_SECRET',
      'access_secret',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: AccessTokenJwtPayload): unknown {
    return payload;
  }
}
