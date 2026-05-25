import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PhotoCategory } from '@prisma/client';

/**
 * DTO pour une photo rattachée à une soumission.
 * On reçoit uniquement l'URL et les métadonnées Cloudinary — jamais le binaire.
 */
export class PhotoDto {
  @IsString()
  @IsNotEmpty()
  cloudinaryPublicId: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(PhotoCategory, { message: 'Catégorie invalide (APP_SCREEN, ID_DOCUMENT, STOREFRONT, QR_CODE)' })
  category: PhotoCategory;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;

  @IsOptional()
  @IsInt()
  bytes?: number;
}
