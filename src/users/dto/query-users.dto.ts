import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * DTO de filtrage pour la liste des utilisateurs.
 * Hérite de PaginationDto (page, limit).
 */
export class QueryUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // recherche sur fullName, email, phone, matricule

  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide' })
  role?: Role;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID('4')
  zoneId?: string;

  @IsOptional()
  @IsUUID('4')
  supervisorId?: string;
}
