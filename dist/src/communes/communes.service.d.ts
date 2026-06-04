import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class CommunesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        zone: {
            id: string;
            name: string;
        } | null;
        _count: {
            quartiers: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        zoneId: string | null;
    })[]>;
    findOne(id: string): Promise<({
        zone: {
            id: string;
            name: string;
        } | null;
        quartiers: ({
            secteur: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            name: string;
            createdAt: Date;
            communeId: string;
            secteurId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        zoneId: string | null;
    }) | null>;
    findByUserZone(user: User): Promise<{
        communes: never[];
        message: string;
        zone?: undefined;
    } | {
        zone: {
            id: string;
            name: string;
        } | null;
        communes: {
            id: string;
            name: string;
            quartiers: {
                id: string;
                name: string;
                secteurId: string | null;
            }[];
        }[];
        message?: undefined;
    }>;
}
