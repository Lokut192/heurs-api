import { Expose } from 'class-transformer';

export class GetJsonTimeExportDto {
  @Expose()
  duration: number;

  @Expose()
  date: string;

  @Expose()
  type: string;

  @Expose()
  notes: string | null;
}
