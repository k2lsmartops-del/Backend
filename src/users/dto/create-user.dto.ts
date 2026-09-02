import { AgentStatus, Role } from '@prisma/client';
import {
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
 *  - COORDINATEUR : pas de clusterId ni supervisorId (compte global)
 *  - SUPERVISEUR  : clusterId obligatoire (dirige un cluster)
 *  - COMMERCIAL   : supervisorId obligatoire (hérite clusterId du superviseur)
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
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password: string;

  @IsEnum(Role, { message: 'Rôle invalide' })
  role: Role;

  @IsOptional()
  @IsEnum(AgentStatus, { message: 'Statut invalide' })
  status?: AgentStatus;

  @IsOptional()
  @IsUUID('4', { message: 'ID de cluster invalide' })
  clusterId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID de superviseur invalide' })
  supervisorId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sponsorCode?: string;

}