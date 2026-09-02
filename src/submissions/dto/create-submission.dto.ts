import { AppStatus, SubmissionType, SyncStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { PhotoDto } from './photo.dto';

/**
 * DTO de création d'une soumission terrain.
 * Deux formulaires distincts selon le type :
 *  - PROSPECT : recrutement client banque
 *  - MARCHAND : enrôlement commerce partenaire
 *
 * Les photos sont des métadonnées Cloudinary (URL + publicId).
 * Le binaire est uploadé directement par le frontend.
 */
export class CreateSubmissionDto {
  @IsEnum(SubmissionType, { message: 'Type invalide (PROSPECT ou MARCHAND)' })
  type: SubmissionType;

  // ── UUID client (offline-first, clé d'idempotence) ──
  @IsString()
  @IsNotEmpty({ message: 'Le clientUuid est requis (identifiant offline)' })
  clientUuid: string;

  // ── Géolocalisation ──
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  gpsAccuracy?: number;

  @IsOptional()
  @IsString()
  gpsCapturedAt?: string;

  // ── Localisation par ID (sélection depuis dropdown) ──
  @IsOptional()
  @IsString()
  communeId?: string;

  @IsOptional()
  @IsString()
  quartierId?: string;

  // ── Localisation texte libre (saisie manuelle si hors zone) ──
  @IsOptional()
  @IsString()
  commune?: string;

  @IsOptional()
  @IsString()
  quartier?: string;

  @IsOptional()
  @IsString()
  addressNote?: string;

  // ══════ CHAMPS PROSPECT ══════
  @IsOptional()
  @IsString()
  prospectFullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\\d{10}$/, { message: 'Le numéro de téléphone doit contenir exactement 10 chiffres' })
  prospectPhone?: string;

  @IsOptional()
  @IsString()
  prospectProfession?: string;

  @IsOptional()
  @IsString()
  prospectGender?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value == null || Number.isNaN(Number(value))) return undefined;
    return Number(value);
  })
  @IsInt()
  @Min(0)
  prospectAge?: number;

  @IsOptional()
  @IsEnum(AppStatus)
  appStatus?: AppStatus;

  @IsOptional()
  @IsString()
  sponsorCode?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  // ══════ CHAMPS MARCHAND ══════
  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsString()
  merchantOwner?: string;

  @IsOptional()
  @IsString()
  merchantPhone?: string;

  @IsOptional()
  @IsString()
  merchantActivity?: string;

  @IsOptional()
  @IsString()
  merchantRccm?: string;

  // ══════ PHOTOS (métadonnées Cloudinary) ══════
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoDto)
  photos?: PhotoDto[];

  // ── Statut demandé (DRAFT ou SUBMITTED) ──
  @IsOptional()
  @IsString()
  requestedStatus?: 'DRAFT' | 'SUBMITTED';

  // ── Synchronisation ──
  @IsOptional()
  @IsBoolean()
  createdOffline?: boolean;

  @IsOptional()
  @IsEnum(SyncStatus)
  syncStatus?: SyncStatus;
}
