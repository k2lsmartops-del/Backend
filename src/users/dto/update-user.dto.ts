import { AgentStatus, Gender, Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

/**
 * DTO de mise à jour d'un utilisateur.
 * Tous les champs sont optionnels — seuls les champs envoyés sont modifiés.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: "Format d'email invalide" })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  password?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide' })
  role?: Role;

  @IsOptional()
  @IsEnum(AgentStatus, { message: 'Statut invalide' })
  status?: AgentStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'ID de zone invalide' })
  zoneId?: string | null;

  @IsOptional()
  @IsUUID('4', { message: 'ID de superviseur invalide' })
  supervisorId?: string | null;

  // ── Informations personnelles (document K2L) ──

  @IsOptional()
  @IsString()
  phoneSecondary?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsEnum(Gender, { message: 'Genre invalide (HOMME ou FEMME)' })
  gender?: Gender | null;

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide (ISO 8601)' })
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  cniNumber?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  educationLevel?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide (ISO 8601)' })
  recruitedAt?: string | null;
}
