import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
export declare class SubmissionsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSubmissionDto, user: Omit<User, 'password'>): Promise<{
        _idempotent: boolean;
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
        }[];
    } | {
        _duplicateWarning: string | undefined;
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
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
            zoneId: string | null;
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
            phoneType: string | null;
            bankAccount: string | null;
            observations: string | null;
            merchantName: string | null;
            merchantOwner: string | null;
            merchantPhone: string | null;
            merchantActivity: string | null;
            merchantRccm: string | null;
            syncStatus: import("@prisma/client").$Enums.SyncStatus;
            createdOffline: boolean;
            level1At: Date | null;
            level1Comment: string | null;
            level2At: Date | null;
            level2Comment: string | null;
            createdAt: Date;
            submittedAt: Date | null;
            updatedAt: Date;
            commercial: {
                id: string;
                matricule: string;
                fullName: string;
            };
            level1Validator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            level2Validator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            photos: {
                id: string;
                url: string;
                category: import("@prisma/client").$Enums.PhotoCategory | null;
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
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
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
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
        }[];
    }>;
    checkEditable(id: string, user: Omit<User, 'password'>): Promise<{
        editable: boolean;
        status: import("@prisma/client").$Enums.SubmissionStatus;
    }>;
    remove(id: string, user: Omit<User, 'password'>): Promise<{
        deleted: boolean;
    }>;
    approveLevel1(id: string, user: Omit<User, 'password'>, comment?: string): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
        }[];
    }>;
    approveLevel2(id: string, user: Omit<User, 'password'>, comment?: string): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
        }[];
    }>;
    rejectLevel1(id: string, user: Omit<User, 'password'>, comment: string): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
        }[];
    }>;
    rejectLevel2(id: string, user: Omit<User, 'password'>, comment: string): Promise<{
        id: string;
        clientUuid: string;
        type: import("@prisma/client").$Enums.SubmissionType;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        commercialId: string;
        zoneId: string | null;
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
        phoneType: string | null;
        bankAccount: string | null;
        observations: string | null;
        merchantName: string | null;
        merchantOwner: string | null;
        merchantPhone: string | null;
        merchantActivity: string | null;
        merchantRccm: string | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        createdOffline: boolean;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        createdAt: Date;
        submittedAt: Date | null;
        updatedAt: Date;
        commercial: {
            id: string;
            matricule: string;
            fullName: string;
        };
        level1Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        level2Validator: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        photos: {
            id: string;
            url: string;
            category: import("@prisma/client").$Enums.PhotoCategory | null;
        }[];
    }>;
    getStats(user: Omit<User, 'password'>, zoneId?: string): Promise<{
        total: number;
        byStatus: {
            draft: number;
            submitted: number;
            supervisorApproved: number;
            validated: number;
            rejectedL1: number;
            rejectedL2: number;
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
        pending: {
            level1: number;
            level2: number;
        };
    }>;
    private validateFieldsByType;
    private validatePhotosByType;
    private checkAccessToSubmission;
}
