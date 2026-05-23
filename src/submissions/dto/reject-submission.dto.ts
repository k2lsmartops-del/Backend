import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO pour le rejet d'une soumission.
 * Le commentaire est obligatoire pour justifier le rejet.
 */
export class RejectSubmissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Le motif du rejet est obligatoire' })
  comment: string;
}
