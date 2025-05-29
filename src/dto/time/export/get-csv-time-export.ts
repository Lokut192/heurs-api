import { Expose } from 'class-transformer';

export class GetCsvTimeExportDto {
  @Expose()
  date: string;

  @Expose()
  duration: number;

  @Expose()
  type: string;

  @Expose()
  notes: string | null;
}
