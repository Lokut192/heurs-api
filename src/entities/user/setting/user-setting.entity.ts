import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { UserSettingTypes } from '../../../modules/users/user-settings/user-setting-type.enum';
import { User } from '../user.entity';

@Entity({ name: 'user_settings' })
@Unique(['user', 'code'])
export class UserSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'code' })
  code: string;

  @Column({ name: 'value', type: 'text', nullable: true, default: null })
  value: string | null;

  @Column({
    type: 'enum',
    nullable: false,
    enum: UserSettingTypes,
    default: UserSettingTypes.Text,
  })
  type: UserSettingTypes;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
    nullable: true,
  })
  updatedAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }
}
