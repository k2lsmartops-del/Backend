import { AgentStatus, Role } from '@prisma/client';
import {
  IsBoolean,
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
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
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

  @IsOptional()
  @IsString()
  sponsorCode?: string | null;

}
