import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Une ligne d'import provenant du fichier Excel.
 *
 * Colonnes attendues :
 *  - role        : COORDINATEUR | SUPERVISEUR | COMMERCIAL
 *  - fullName    : Nom complet
 *  - phone       : Téléphone (identifiant de connexion)
 *  - email       : Email (optionnel)
 *  - password    : Mot de passe (optionnel — défaut généré sinon)
 *  - cluster     : Nom du cluster (SUPERVISEUR + COMMERCIAL uniquement)
 *  - zone        : (DEPRECATED) Alias de cluster pour rétrocompatibilité
 *  - sponsorCode : Code de parrainage unique (traçabilité des recrutements)
 *  - commune     : Commune principale (ex: Abobo, Yopougon)
 *  - habitation  : Adresse d'habitation (informatif)
 *
 * Nouvelle logique simplifiée :
 *  - COORDINATEUR : pas de rattachement territorial
 *  - SUPERVISEUR  : lié à un cluster
 *  - COMMERCIAL   : lié à un cluster (comme le superviseur)
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
  cluster?: string;

  // Rétrocompatibilité : accepte aussi "zone" comme alias de "cluster"
  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sponsorCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  commune?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  habitation?: string;
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
