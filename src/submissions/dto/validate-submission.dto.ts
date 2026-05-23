import { IsOptional, IsString } from 'class-validator';

/**
 * DTO pour les actions de validation/rejet.
 * Le commentaire est optionnel pour les validations, obligatoire pour les rejets.
 */
export class ValidateSubmissionDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
