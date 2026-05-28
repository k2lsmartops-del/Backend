import { IsArray, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs de communes invalides' })
  communeIds?: string[];

  @IsOptional()
  @ValidateIf((o) => o.coordinatorId !== null && o.coordinatorId !== '')
  @IsUUID('4', { message: 'ID de coordinateur invalide' })
  coordinatorId?: string | null;
}
