import type { Cache } from 'cache-manager';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
export interface StatsResult {
    total: number;
    byStatus: {
        draft: number;
        submitted: number;
        validated: number;
        rejected: number;
    };
    byType: {
        prospects: number;
        marchands: number;
    };
    today: {
        total: number;
        validated: number;
    };
    week: {
        total: number;
        validated: number;
    };
    validationRate: number;
    pending: number;
}
interface ProductionKPIs {
    plannedWorkforce: number;
    recruitedWorkforce: number;
    activeTodayWorkforce: number;
    clientsApproached: number;
    installations: number;
    installationsPlusActivations: number;
    activationRate: number;
}
interface PerformanceKPIs {
    objective: number;
    achieved: number;
    achievementPercent: number;
    productivityPerAgent: number;
    clusterPerformance: {
        clusterId: string;
        clusterName: string;
        achieved: number;
        objective: number;
    }[];
}
interface QualityKPIs {
    filesSubmitted: number;
    filesValidated: number;
    filesRejected: number;
    validationRate: number;
}
interface PilotageKPIs {
    coveredZones: number;
    mainAlerts: {
        type: string;
        count: number;
        message: string;
    }[];
    globalScore: number;
}
export interface ComprehensiveKPIs {
    production: ProductionKPIs;
    performance: PerformanceKPIs;
    quality: QualityKPIs;
    pilotage: PilotageKPIs;
}
export declare class SubmissionsService {
    private prisma;
    private cache;
    private readonly logger;
    constructor(prisma: PrismaService, cache: Cache);
    create(dto: CreateSubmissionDto, user: Omit<User, 'password'>): Promise<{
        _idempotent: boolean;
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        clusterId: string | null;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
        prospectProfession: string | null;
        prospectGender: string | null;
        prospectAge: number | null;
        appStatus: import("@prisma/client").$Enums.AppStatus | null;
        sponsorCode: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        validatedAt: Date | null;
        validationComment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            sponsorCode: string | null;
            matricule: string;
            fullName: string;
        };
        validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory;
        }[];
    } | {
        _duplicateWarning: string | undefined;
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        clusterId: string | null;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
        prospectProfession: string | null;
        prospectGender: string | null;
        prospectAge: number | null;
        appStatus: import("@prisma/client").$Enums.AppStatus | null;
        sponsorCode: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        validatedAt: Date | null;
        validationComment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            sponsorCode: string | null;
            matricule: string;
            fullName: string;
        };
        validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory;
        }[];
    }>;
    syncBatch(dtos: CreateSubmissionDto[], user: Omit<User, 'password'>): Promise<{
        total: number;
        synced: number;
        failed: number;
        results: {
            clientUuid: string;
            status: string;
            data?: unknown;
            error?: string;
        }[];
    }>;
    findAll(query: QuerySubmissionsDto, user: Omit<User, 'password'>): Promise<{
        data: {
            id: string;
            clientUuid: string;
            type: import("@prisma/client").$Enums.SubmissionType;
            status: import("@prisma/client").$Enums.SubmissionStatus;
            commercialId: string;
            clusterId: string | null;
            latitude: number | null;
            longitude: number | null;
            gpsAccuracy: number | null;
            gpsCapturedAt: Date | null;
            commune: string;
            quartier: string | null;
            addressNote: string | null;
            prospectFullName: string | null;
            prospectPhone: string | null;
            prospectProfession: string | null;
            prospectGender: string | null;
            prospectAge: number | null;
            appStatus: import("@prisma/client").$Enums.AppStatus | null;
            sponsorCode: string | null;
            observations: string | null;
            merchantName: string | null;
            merchantOwner: string | null;
            merchantPhone: string | null;
            merchantActivity: string | null;
            merchantRccm: string | null;
            syncStatus: import("@prisma/client").$Enums.SyncStatus;
            createdOffline: boolean;
            validatedAt: Date | null;
            validationComment: string | null;
            createdAt: Date;
            submittedAt: Date | null;
            updatedAt: Date;
            commercial: {
                id: string;
                sponsorCode: string | null;
                matricule: string;
                fullName: string;
            };
            validator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            photos: {
                id: string;
                url: string;
                category: import("@prisma/client").$Enums.PhotoCategory;
            }[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, user: Omit<User, 'password'>): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        clusterId: string | null;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
        prospectProfession: string | null;
        prospectGender: string | null;
        prospectAge: number | null;
        appStatus: import("@prisma/client").$Enums.AppStatus | null;
        sponsorCode: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        validatedAt: Date | null;
        validationComment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            sponsorCode: string | null;
            matricule: string;
            fullName: string;
        };
        validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory;
        }[];
        validationHistory: {
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.ValidationAction;
            comment: string | null;
            actor: {
                id: string;
                matricule: string;
                fullName: string;
            };
        }[];
    }>;
    update(id: string, dto: import('./dto/update-submission.dto').UpdateSubmissionDto, user: Omit<User, 'password'>): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        clusterId: string | null;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
        prospectProfession: string | null;
        prospectGender: string | null;
        prospectAge: number | null;
        appStatus: import("@prisma/client").$Enums.AppStatus | null;
        sponsorCode: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        validatedAt: Date | null;
        validationComment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            sponsorCode: string | null;
            matricule: string;
            fullName: string;
        };
        validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory;
        }[];
    }>;
    checkEditable(id: string, user: Omit<User, 'password'>): Promise<{
        editable: boolean;
        status: import("@prisma/client").$Enums.SubmissionStatus;
    }>;
    remove(id: string, user: Omit<User, 'password'>): Promise<{
        deleted: boolean;
    }>;
    validate(id: string, user: Omit<User, 'password'>, comment?: string): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        clusterId: string | null;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
        prospectProfession: string | null;
        prospectGender: string | null;
        prospectAge: number | null;
        appStatus: import("@prisma/client").$Enums.AppStatus | null;
        sponsorCode: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        validatedAt: Date | null;
        validationComment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            sponsorCode: string | null;
            matricule: string;
            fullName: string;
        };
        validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory;
        }[];
    }>;
    reject(id: string, user: Omit<User, 'password'>, comment: string): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        clusterId: string | null;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
        prospectProfession: string | null;
        prospectGender: string | null;
        prospectAge: number | null;
        appStatus: import("@prisma/client").$Enums.AppStatus | null;
        sponsorCode: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        validatedAt: Date | null;
        validationComment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            sponsorCode: string | null;
            matricule: string;
            fullName: string;
        };
        validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory;
        }[];
    }>;
    getStats(user: Omit<User, 'password'>, clusterId?: string, period?: 'day' | 'week' | 'month'): Promise<ComprehensiveKPIs>;
    private validateFieldsByType;
    private validatePhotosByType;
    private checkAccessToSubmission;
}
export {};
