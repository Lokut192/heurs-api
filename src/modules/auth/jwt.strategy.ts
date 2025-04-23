import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entities/user/user.entity';

import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET', 'secret');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(
    payload: { id: number; username: string; email: string } & Record<
      string,
      string
    >,
  ) {
    let user: User | null = null;

    try {
      user = await this.usersService.findOneById(payload.id);
    } catch (_userNotFoundException) {
      user = null;
    }

    if (user === null) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      userUsername: user.username,
      userEmail: user.email,
    };
  }
}
