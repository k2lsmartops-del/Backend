import { CommunesService } from './communes.service';
export declare class CommunesController {
    private communesService;
    constructor(communesService: CommunesService);
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
            secteurId: string | null;
            communeId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        zoneId: string | null;
    }) | null>;
}
