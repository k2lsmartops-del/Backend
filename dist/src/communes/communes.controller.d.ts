import type { User } from '@prisma/client';
import { CommunesService } from './communes.service';
export declare class CommunesController {
    private communesService;
    constructor(communesService: CommunesService);
    findMyCluster(user: User): Promise<{
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
        name: string;
        createdAt: Date;
        clusterId: string | null;
    })[]>;
    findOne(id: string): Promise<({
        cluster: {
            id: string;
            name: string;
        } | null;
        quartiers: {
            id: string;
            name: string;
            createdAt: Date;
            communeId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        clusterId: string | null;
    }) | null>;
}
