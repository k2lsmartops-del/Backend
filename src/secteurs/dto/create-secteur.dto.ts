import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSecteurDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du secteur est requis' })
  name: string;

  @IsUUID('4', { message: 'ID de zone invalide' })
  zoneId: string;

  @IsArray()
  @IsUUID('4', { each: true, message: 'IDs de quartiers invalides' })
  quartierIds: string[];

  @IsOptional()
  @IsUUID('4', { message: 'ID de superviseur invalide' })
  supervisorId?: string;
}
