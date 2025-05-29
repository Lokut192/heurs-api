import { IsString } from 'class-validator';

export class PutUserSettingDto {
  @IsString()
  value: string;
}
