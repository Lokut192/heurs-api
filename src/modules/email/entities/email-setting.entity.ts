import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'email_settings' })
export class EmailSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'smtp_host' })
  smtpHost: string;

  @Column({ name: 'smtp_port' })
  smtpPort: number;

  @Column({ name: 'smtp_user' })
  smtpUser: string;

  @Column({ name: 'smtp_password' })
  smtpPassword: string;

  @Column({ name: 'default_from' })
  defaultFrom: string;

  @Column({ default: true, nullable: false })
  active: boolean;
}
