import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../user/user.entity';

@Entity({ name: 'times' })
export class Time {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  duration: number;

  @ManyToOne(() => User, (user) => user.times, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
  })
  createdAt: Date;
}
