import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import { User } from '../../user/user.entity';

@Entity({ name: 'month_times_statistics' })
@Unique(['month', 'year', 'userId'])
export class MonthTimesStatistics {
  @Column({ name: 'overtime_times_count' })
  overtimeTimesCount: number;

  @Column({ name: 'overtime_total_duration' })
  overtimeTotalDuration: number;

  @Column({ name: 'times_count' })
  timesCount: number;

  @Column({ name: 'total_duration' })
  totalDuration: number;

  @PrimaryColumn()
  @Column()
  month: number;

  @PrimaryColumn()
  @Column()
  year: number;

  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
