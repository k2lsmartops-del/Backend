import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la zone est requis' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs de communes invalides' })
  communeIds: string[];

  @IsOptional()
  @IsUUID('4', { message: 'ID de coordinateur invalide' })
  coordinatorId?: string;
}
