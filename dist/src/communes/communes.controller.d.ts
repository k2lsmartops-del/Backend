import type { User } from '@prisma/client';
import { CommunesService } from './communes.service';
export declare class CommunesController {
    private communesService;
    constructor(communesService: CommunesService);
    findMyZone(user: User): Promise<{
        communes: never[];
        message: string;
        zone?: undefined;
    } | {
        zone: {
            name: string;
            id: string;
        } | null;
        communes: {
            id: string;
            name: string;
            quartiers: {
                name: string;
                id: string;
                secteurId: string | null;
            }[];
        }[];
        message?: undefined;
    }>;
    findAll(): Promise<({
        zone: {
            name: string;
            id: string;
        } | null;
        _count: {
            quartiers: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        zoneId: string | null;
    })[]>;
    findOne(id: string): Promise<({
        zone: {
            name: string;
            id: string;
        } | null;
        quartiers: ({
            secteur: {
                name: string;
                id: string;
            } | null;
        } & {
            name: string;
            id: string;
            createdAt: Date;
            secteurId: string | null;
            communeId: string;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        zoneId: string | null;
    }) | null>;
}
