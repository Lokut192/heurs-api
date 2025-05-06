import { Profiles } from '../users/user-profile/profiles.enum';

export type LoggedUserType = {
  userId: number;
  userUsername: string;
  userEmail: string;
  sessionId: string;
  userProfiles: Profiles[];
};
