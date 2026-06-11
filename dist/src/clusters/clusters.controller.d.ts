import { User } from '@prisma/client';
import { ClustersService } from './clusters.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { UpdateClusterDto } from './dto/update-cluster.dto';
import { AssignSupervisorDto } from './dto/assign-supervisor.dto';
export declare class ClustersController {
    private clustersService;
    constructor(clustersService: ClustersService);
    create(dto: CreateClusterDto): Promise<{
        supervisor: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
        } | null;
        members: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
        }[];
        communes: {
            id: string;
            name: string;
            _count: {
                quartiers: number;
            };
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        name: string;
        description: string | null;
    }>;
    findAll(user: Omit<User, 'password'>): Promise<({
        supervisor: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
        } | null;
        communes: {
            id: string;
            name: string;
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        name: string;
        description: string | null;
    })[]>;
    findOne(id: string): Promise<{
        supervisor: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
        } | null;
        members: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
        }[];
        communes: {
            id: string;
            name: string;
            _count: {
                quartiers: number;
            };
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        name: string;
        description: string | null;
    }>;
    update(id: string, dto: UpdateClusterDto): Promise<{
        supervisor: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
        } | null;
        members: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
        }[];
        communes: {
            id: string;
            name: string;
            _count: {
                quartiers: number;
            };
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        name: string;
        description: string | null;
    }>;
    assignSupervisor(clusterId: string, dto: AssignSupervisorDto): Promise<{
        clusterId: string;
        clusterName: string;
        newSupervisorId: string;
        newSupervisorName: string;
        ancienSupervisorId: string | null;
        commerciauxUpdated: number;
    }>;
    removeSupervisor(clusterId: string): Promise<{
        clusterId: string;
        clusterName: string;
        message: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        name: string;
        description: string | null;
    }>;
}
