import * as bcrypt from 'bcryptjs';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Time } from '../time/time.entity';
import { Profile } from './profile/profile.entity';
import { UserSession } from './user-session.entity';

@Entity({ name: 'users' })
export class User {
  // #region Properties

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => UserSession, (userSession) => userSession.user)
  sessions: UserSession[];

  // #endregion Properties

  // #region Profiles

  @ManyToMany(() => Profile, (profile) => profile.users)
  @JoinTable({
    name: 'user_profile',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'profile_id',
      referencedColumnName: 'id',
    },
  })
  profiles: Profile[];

  // #endregion Profiles

  // #region Times

  @OneToMany(() => Time, (time) => time.user)
  times: Time[];

  // #endregion Times

  // #region Methods

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // #region Methods
}
