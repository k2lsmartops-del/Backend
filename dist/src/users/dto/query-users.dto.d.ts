import { AgentStatus, Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryUsersDto extends PaginationDto {
    search?: string;
    role?: Role;
    status?: AgentStatus;
    isActive?: boolean;
    clusterId?: string;
    supervisorId?: string;
}
