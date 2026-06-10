import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class CommunesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        cluster: {
            id: string;
            name: string;
        } | null;
        _count: {
            quartiers: number;
        };
    } & {
        id: string;
        createdAt: Date;
        clusterId: string | null;
        name: string;
    })[]>;
    findOne(id: string): Promise<({
        cluster: {
            id: string;
            name: string;
        } | null;
        quartiers: {
            id: string;
            createdAt: Date;
            name: string;
            communeId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        clusterId: string | null;
        name: string;
    }) | null>;
    findByUserCluster(user: User): Promise<{
        communes: never[];
        message: string;
        cluster?: undefined;
    } | {
        cluster: {
            id: string;
            name: string;
        } | null;
        communes: {
            id: string;
            name: string;
            quartiers: {
                id: string;
                name: string;
            }[];
        }[];
        message?: undefined;
    }>;
}
