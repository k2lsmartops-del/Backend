import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateClusterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  communeIds?: string[];
}
