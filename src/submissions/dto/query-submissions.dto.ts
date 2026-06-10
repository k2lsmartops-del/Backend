import { SubmissionStatus, SubmissionType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * DTO de filtrage pour la liste des soumissions.
 */
export class QuerySubmissionsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SubmissionType)
  type?: SubmissionType;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsUUID('4')
  clusterId?: string;

  @IsOptional()
  @IsUUID('4')
  commercialId?: string;

  @IsOptional()
  @IsString()
  commune?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
