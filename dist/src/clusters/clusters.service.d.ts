import { PrismaService } from '../prisma/prisma.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { UpdateClusterDto } from './dto/update-cluster.dto';
export declare class ClustersService {
    private prisma;
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        name: string;
        description: string | null;
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
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        name: string;
        description: string | null;
    }>;
    private validateSupervisor;
}
