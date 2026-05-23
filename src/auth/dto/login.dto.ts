import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO pour la connexion.
 * L'identifiant peut être un numéro de téléphone OU un email.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "L'identifiant est requis" })
  identifiant: string; // phone ou email

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}
