import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'time_zones' })
export class TimeZone {
  @PrimaryColumn()
  name: string;
}
