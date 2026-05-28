import { IsArray, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateSecteurDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs de quartiers invalides' })
  quartierIds?: string[];

  @IsOptional()
  @ValidateIf((o) => o.supervisorId !== null && o.supervisorId !== '')
  @IsUUID('4', { message: 'ID de superviseur invalide' })
  supervisorId?: string | null;
}
