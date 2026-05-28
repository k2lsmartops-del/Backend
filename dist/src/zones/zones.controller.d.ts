import { User } from '@prisma/client';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
export declare class ZonesController {
    private zonesService;
    constructor(zonesService: ZonesService);
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
    findAll(user: Omit<User, 'password'>): Promise<({
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
    getQuartiersDisponibles(id: string): Promise<({
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
}
