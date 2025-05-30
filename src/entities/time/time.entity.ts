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

  @Column({
    default: TimeType.Overtime,
    nullable: false,
    type: 'enum',
    enum: TimeType,
  })
  type: TimeType;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true, default: null })
  notes: string | null;

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
