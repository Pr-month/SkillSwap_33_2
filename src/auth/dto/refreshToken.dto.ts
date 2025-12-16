import { IsJWT } from 'class-validator';

export class CreateRefreshTokenDto {
  @IsJWT()
  refreshToken: string;
}
