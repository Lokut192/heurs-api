import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Profiles } from '../../../modules/users/user-profile/profiles.enum';
import { User } from '../user.entity';

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, type: 'enum', enum: Profiles })
  identifier: string;

  @Column({ default: 1 })
  level: number;

  @ManyToMany(() => User, (user) => user.profiles)
  users: User[];
}
