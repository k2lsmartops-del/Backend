import { AppStatus, SubmissionType, SyncStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * DTO de création d'une soumission terrain.
 * Deux formulaires distincts selon le type :
 *  - PROSPECT : recrutement client banque
 *  - MARCHAND : enrôlement commerce partenaire
 */
export class CreateSubmissionDto {
  @IsEnum(SubmissionType, { message: 'Type invalide (PROSPECT ou MARCHAND)' })
  type: SubmissionType;

  // ── UUID client (offline-first) ──
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

  @IsString()
  @IsNotEmpty({ message: 'La commune est requise' })
  commune: string;

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
  prospectPhone?: string;

  @IsOptional()
  @IsString()
  prospectGender?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prospectAge?: number;

  @IsOptional()
  @IsEnum(AppStatus)
  appStatus?: AppStatus;

  @IsOptional()
  @IsString()
  phoneType?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

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

  // ── Synchronisation ──
  @IsOptional()
  @IsBoolean()
  createdOffline?: boolean;

  @IsOptional()
  @IsEnum(SyncStatus)
  syncStatus?: SyncStatus;
}
