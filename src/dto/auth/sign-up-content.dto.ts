import { ApiProperty } from '@nestjs/swagger';

import { AuthTokensDto } from './tokens.dto';

export class SignUpContentDto extends AuthTokensDto {
  @ApiProperty({ example: 'john.doe' })
  username: string;
  @ApiProperty({ example: 'john.doe@me.com' })
  email: string;
}
