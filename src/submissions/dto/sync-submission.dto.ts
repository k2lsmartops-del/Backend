import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubmissionDto } from './create-submission.dto';

/**
 * DTO pour la synchronisation batch.
 * Permet d'envoyer plusieurs soumissions créées offline en une seule requête.
 */
export class SyncSubmissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubmissionDto)
  submissions: CreateSubmissionDto[];
}
