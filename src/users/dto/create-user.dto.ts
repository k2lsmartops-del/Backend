import { AgentStatus, Gender, Role } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

/**
 * DTO de création d'un utilisateur.
 * Seul l'ADMIN peut créer tous les types d'utilisateur.
 *
 * Règles de rattachement :
 *  - COORDINATEUR : pas de zoneId ni supervisorId (la zone sera rattachée via le CRUD zones)
 *  - SUPERVISEUR  : zoneId obligatoire
 *  - COMMERCIAL   : zoneId + supervisorId obligatoires
 *  - CLIENT       : aucun rattachement
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom complet est requis' })
  fullName: string;

  @IsOptional()
  @IsEmail({}, { message: "Format d'email invalide" })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  phone: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  password: string;

  @IsEnum(Role, { message: 'Rôle invalide' })
  role: Role;

  @IsOptional()
  @IsEnum(AgentStatus, { message: 'Statut invalide' })
  status?: AgentStatus;

  @IsOptional()
  @IsUUID('4', { message: 'ID de zone invalide' })
  zoneId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID de superviseur invalide' })
  supervisorId?: string;

  // ── Informations personnelles (document K2L) ──

  @IsOptional()
  @IsString()
  phoneSecondary?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Genre invalide (HOMME ou FEMME)' })
  gender?: Gender;

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide (ISO 8601)' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  cniNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide (ISO 8601)' })
  recruitedAt?: string;
}