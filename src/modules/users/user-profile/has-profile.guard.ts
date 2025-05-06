// src/common/guards/has-profile.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HAS_PROFILE_KEY } from 'src/decorators/permissions/has-profile.decorator';

@Injectable()
export class HasProfileGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredProfiles = this.reflector.getAllAndOverride<string[]>(
      HAS_PROFILE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no profile is required
    if (!requiredProfiles || requiredProfiles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !Array.isArray(user.userProfiles)) {
      throw new ForbiddenException('User has no profiles.');
    }

    const accessGranted = requiredProfiles.every((p: any) =>
      user.userProfiles.includes(p),
    );

    if (!accessGranted) {
      throw new ForbiddenException('Access denied: missing required profile');
    }

    return true;
  }
}
