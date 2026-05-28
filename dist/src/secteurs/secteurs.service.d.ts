import { PrismaService } from '../prisma/prisma.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { UpdateSecteurDto } from './dto/update-secteur.dto';
export declare class SecteursService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSecteurDto): Promise<{
        members: {
            id: string;
            isActive: boolean;
            matricule: string;
            fullName: string;
        }[];
        zone: {
            id: string;
            name: string;
        };
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        quartiers: ({
            commune: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            secteurId: string | null;
            communeId: string;
        })[];
        _count: {
            members: number;
            quartiers: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zoneId: string;
        supervisorId: string | null;
    }>;
    findAll(zoneId?: string): Promise<({
        zone: {
            id: string;
            name: string;
        };
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        _count: {
            members: number;
            quartiers: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zoneId: string;
        supervisorId: string | null;
    })[]>;
    findAllFiltered(currentUser: {
        role: string;
        zoneId?: string | null;
        secteurId?: string | null;
    }, zoneId?: string): Promise<({
        zone: {
            id: string;
            name: string;
        };
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        _count: {
            members: number;
            quartiers: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zoneId: string;
        supervisorId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        members: {
            id: string;
            isActive: boolean;
            matricule: string;
            fullName: string;
        }[];
        zone: {
            id: string;
            name: string;
        };
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        quartiers: ({
            commune: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            secteurId: string | null;
            communeId: string;
        })[];
        _count: {
            members: number;
            quartiers: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zoneId: string;
        supervisorId: string | null;
    }>;
    update(id: string, dto: UpdateSecteurDto): Promise<{
        members: {
            id: string;
            isActive: boolean;
            matricule: string;
            fullName: string;
        }[];
        zone: {
            id: string;
            name: string;
        };
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        quartiers: ({
            commune: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            secteurId: string | null;
            communeId: string;
        })[];
        _count: {
            members: number;
            quartiers: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zoneId: string;
        supervisorId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zoneId: string;
        supervisorId: string | null;
    }>;
    private validateSupervisor;
    private validateQuartiers;
}
