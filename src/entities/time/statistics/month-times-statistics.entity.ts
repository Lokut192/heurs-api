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

@Entity({ name: 'month_times_statistics' })
@Unique(['month', 'year', 'userId'])
export class MonthTimesStatistics {
  // #region Properties

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
