import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserSettingTypes } from 'src/modules/users/user-settings/user-setting-type.enum';

export class GetUserSettingDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'TIME_ZONE' })
  @Expose()
  code: string;

  @ApiProperty({ example: UserSettingTypes.Text })
  @Expose()
  type: UserSettingTypes;

  @ApiProperty({ example: 'Europe/Paris', nullable: true })
  @Expose()
  value: string | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: string;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
  })
  @Expose()
  updatedAt: string | null;
}
