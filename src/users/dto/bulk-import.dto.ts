import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * Une ligne d'import provenant du fichier Excel.
 *
 * Colonnes attendues :
 *  - role           : COORDINATEUR | SUPERVISEUR | COMMERCIAL
 *  - fullName       : Nom complet
 *  - phone          : Téléphone (identifiant de connexion)
 *  - email          : Email (optionnel)
 *  - password       : Mot de passe (optionnel — défaut généré sinon)
 *  - zone           : Nom de la zone (COORDINATEUR + SUPERVISEUR)
 *  - secteur        : Nom du secteur (SUPERVISEUR)
 *  - supervisorPhone: Téléphone du superviseur de rattachement (COMMERCIAL)
 */
export class BulkImportRowDto {
  @IsString()
  role: string;

  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  secteur?: string;

  @IsOptional()
  @IsString()
  supervisorPhone?: string;
}

/**
 * DTO d'import en masse d'utilisateurs (équipe complète).
 * Réservé à l'ADMIN.
 */
export class BulkImportDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Aucune ligne à importer' })
  @ArrayMaxSize(2000, { message: 'Maximum 2000 lignes par import' })
  @ValidateNested({ each: true })
  @Type(() => BulkImportRowDto)
  rows: BulkImportRowDto[];
}
