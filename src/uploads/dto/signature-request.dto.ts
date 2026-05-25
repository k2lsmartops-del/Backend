import { IsOptional, IsString } from 'class-validator';

/**
 * DTO pour demander une signature Cloudinary.
 * Le frontend envoie le folder et un tag optionnel.
 */
export class SignatureRequestDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  publicId?: string;
}
