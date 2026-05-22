import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO pour le rafraîchissement du token.
 */
export class RefreshDto {
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  refreshToken: string;
}
