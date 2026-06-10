import { SubmissionStatus, SubmissionType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QuerySubmissionsDto extends PaginationDto {
    type?: SubmissionType;
    status?: SubmissionStatus;
    clusterId?: string;
    commercialId?: string;
    commune?: string;
    search?: string;
}
