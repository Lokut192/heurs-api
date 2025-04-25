import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity({ name: 'user_session' })
export class UserSession {
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  sessionId: string;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'started_at',
    default: () => 'CURRENT_TIMESTAMP',
    type: 'datetime',
    precision: 3,
  })
  startedAt: Date;

  @Column({
    name: 'expires _at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  expiresAt: Date;
}
