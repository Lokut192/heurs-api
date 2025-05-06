import { SetMetadata } from '@nestjs/common';

export const HAS_PROFILE_KEY = 'REQUIRED_PROFILES';

export const HasProfile = (...profiles: string[]) =>
  SetMetadata(HAS_PROFILE_KEY, profiles);
