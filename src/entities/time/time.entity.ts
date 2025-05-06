import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TimeType } from '../../modules/times/TimeType.enum';
import { User } from '../user/user.entity';

@Entity({ name: 'times' })
export class Time {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  duration: number;

  @Column({ default: TimeType.Overtime, nullable: false })
  type: string;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => User, (user) => user.times, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
  })
  createdAt: Date;
}
