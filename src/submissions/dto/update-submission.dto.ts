import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionType } from '@prisma/client';
import { PhotoDto } from './photo.dto';

/**
 * DTO pour la modification d'une soumission.
 * Seules les soumissions au statut SUBMITTED ou DRAFT peuvent être modifiées.
 */
export class UpdateSubmissionDto {
  @IsOptional()
  @IsEnum(SubmissionType)
  type?: SubmissionType;

  // ── Localisation ──
  @IsOptional()
  @IsString()
  commune?: string;

  @IsOptional()
  @IsString()
  addressNote?: string;

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
  @IsDateString()
  gpsCapturedAt?: string;

  // ── Prospect ──
  @IsOptional()
  @IsString()
  prospectPhone?: string;

  @IsOptional()
  @IsString()
  prospectGender?: string;

  @IsOptional()
  @IsString()
  appStatus?: string;

  @IsOptional()
  @IsString()
  sponsorCode?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  // ── Marchand ──
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

  // ── Photos ──
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoDto)
  photos?: PhotoDto[];
}
