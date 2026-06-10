import { IsArray, IsOptional, IsString, IsUUID, IsBoolean, ValidateIf } from 'class-validator';

export class UpdateClusterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  communeIds?: string[];

  @IsOptional()
  @ValidateIf((o) => o.supervisorId !== null && o.supervisorId !== '')
  @IsUUID('4')
  supervisorId?: string | null;
}
