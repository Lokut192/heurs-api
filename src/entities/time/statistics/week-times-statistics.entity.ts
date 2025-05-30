import { DateTime } from 'luxon';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import { User } from '../../user/user.entity';

@Entity({ name: 'week_times_statistics' })
@Unique(['week', 'year', 'userId'])
export class WeekTimesStatistics {
  // #region Properties

  @Column({ name: 'overtime_times_count' })
  overtimeTimesCount: number;

  @Column({ name: 'overtime_total_duration' })
  overtimeTotalDuration: number;

  @Column({ name: 'recovery_times_count', default: 0 })
  recoveryTimesCount: number;

  @Column({ name: 'recovery_total_duration', default: 0 })
  recoveryTotalDuration: number;

  @Column({ name: 'times_count' })
  timesCount: number;

  @Column({ name: 'total_duration' })
  totalDuration: number;

  @PrimaryColumn()
  week: number;

  @PrimaryColumn()
  year: number;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
    name: 'updated_at',
  })
  updatedAt: Date;

  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  //#endregion Properties

  // #region Methods

  @BeforeInsert()
  @BeforeUpdate()
  async setUpdatedAtProperty() {
    this.updatedAt = DateTime.now().toUTC().toJSDate();
  }

  // #endregion Methods
}
