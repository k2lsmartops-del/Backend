import { PrismaService } from '../prisma/prisma.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { UpdateClusterDto } from './dto/update-cluster.dto';
export declare class ClustersService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateClusterDto): Promise<{
        supervisor: {
            id: string;
            matricule: string;
            phone: string;
            fullName: string;
        } | null;
        members: {
            id: string;
            isActive: boolean;
            matricule: string;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
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
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
    }>;
    findAll(): Promise<({
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
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
    })[]>;
    findAllFiltered(currentUser: {
        role: string;
        clusterId?: string | null;
    }): Promise<({
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
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
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
            isActive: boolean;
            matricule: string;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
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
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
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
            isActive: boolean;
            matricule: string;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
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
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
    }>;
    private validateSupervisor;
    assignSupervisor(clusterId: string, newSupervisorId: string): Promise<{
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
}
