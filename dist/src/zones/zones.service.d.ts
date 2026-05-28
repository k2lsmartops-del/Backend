import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
export declare class ZonesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateZoneDto): Promise<{
        coordinator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        communes: {
            id: string;
            name: string;
            _count: {
                quartiers: number;
            };
        }[];
        secteurs: {
            id: string;
            name: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            _count: {
                members: number;
                quartiers: number;
            };
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        name: string;
        coordinatorId: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        coordinator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        communes: {
            id: string;
            name: string;
        }[];
        _count: {
            members: number;
            secteurs: number;
        };
    } & {
        id: string;
        name: string;
        coordinatorId: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findAllFiltered(currentUser: {
        role: string;
        zoneId?: string | null;
    }): Promise<({
        coordinator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        communes: {
            id: string;
            name: string;
        }[];
        _count: {
            members: number;
            secteurs: number;
        };
    } & {
        id: string;
        name: string;
        coordinatorId: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        coordinator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        communes: {
            id: string;
            name: string;
            _count: {
                quartiers: number;
            };
        }[];
        secteurs: {
            id: string;
            name: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            _count: {
                members: number;
                quartiers: number;
            };
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        name: string;
        coordinatorId: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateZoneDto): Promise<{
        coordinator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        communes: {
            id: string;
            name: string;
            _count: {
                quartiers: number;
            };
        }[];
        secteurs: {
            id: string;
            name: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            _count: {
                members: number;
                quartiers: number;
            };
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        name: string;
        coordinatorId: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        coordinatorId: string | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getQuartiersDisponibles(zoneId: string): Promise<({
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
    })[]>;
    private validateCoordinator;
}
