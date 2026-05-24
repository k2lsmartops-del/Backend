import { User } from '@prisma/client';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
import { SyncSubmissionsDto } from './dto/sync-submission.dto';
import { ValidateSubmissionDto } from './dto/validate-submission.dto';
import { RejectSubmissionDto } from './dto/reject-submission.dto';
export declare class SubmissionsController {
    private submissionsService;
    constructor(submissionsService: SubmissionsService);
    create(dto: CreateSubmissionDto, user: Omit<User, 'password'>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        zoneId: string | null;
        type: import("@prisma/client").$Enums.SubmissionType;
        clientUuid: string;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
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
        createdOffline: boolean;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        submittedAt: Date | null;
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
            url: string;
            id: string;
            category: string | null;
        }[];
    }>;
    sync(dto: SyncSubmissionsDto, user: Omit<User, 'password'>): Promise<{
        synced: number;
        submissions: unknown[];
    }>;
    findAll(query: QuerySubmissionsDto, user: Omit<User, 'password'>): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.SubmissionStatus;
            zoneId: string | null;
            type: import("@prisma/client").$Enums.SubmissionType;
            clientUuid: string;
            latitude: number | null;
            longitude: number | null;
            gpsAccuracy: number | null;
            gpsCapturedAt: Date | null;
            commune: string;
            quartier: string | null;
            addressNote: string | null;
            prospectFullName: string | null;
            prospectPhone: string | null;
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
            createdOffline: boolean;
            syncStatus: import("@prisma/client").$Enums.SyncStatus;
            level1At: Date | null;
            level1Comment: string | null;
            level2At: Date | null;
            level2Comment: string | null;
            submittedAt: Date | null;
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
                url: string;
                id: string;
                category: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        zoneId: string | null;
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
        type: import("@prisma/client").$Enums.SubmissionType;
        clientUuid: string;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
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
        createdOffline: boolean;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        submittedAt: Date | null;
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
            url: string;
            id: string;
            category: string | null;
        }[];
    }>;
    approveLevel1(id: string, dto: ValidateSubmissionDto, user: Omit<User, 'password'>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        zoneId: string | null;
        type: import("@prisma/client").$Enums.SubmissionType;
        clientUuid: string;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
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
        createdOffline: boolean;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        submittedAt: Date | null;
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
            url: string;
            id: string;
            category: string | null;
        }[];
    }>;
    rejectLevel1(id: string, dto: RejectSubmissionDto, user: Omit<User, 'password'>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        zoneId: string | null;
        type: import("@prisma/client").$Enums.SubmissionType;
        clientUuid: string;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
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
        createdOffline: boolean;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        submittedAt: Date | null;
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
            url: string;
            id: string;
            category: string | null;
        }[];
    }>;
    approveLevel2(id: string, dto: ValidateSubmissionDto, user: Omit<User, 'password'>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        zoneId: string | null;
        type: import("@prisma/client").$Enums.SubmissionType;
        clientUuid: string;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
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
        createdOffline: boolean;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        submittedAt: Date | null;
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
            url: string;
            id: string;
            category: string | null;
        }[];
    }>;
    rejectLevel2(id: string, dto: RejectSubmissionDto, user: Omit<User, 'password'>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        zoneId: string | null;
        type: import("@prisma/client").$Enums.SubmissionType;
        clientUuid: string;
        latitude: number | null;
        longitude: number | null;
        gpsAccuracy: number | null;
        gpsCapturedAt: Date | null;
        commune: string;
        quartier: string | null;
        addressNote: string | null;
        prospectFullName: string | null;
        prospectPhone: string | null;
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
        createdOffline: boolean;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        level1At: Date | null;
        level1Comment: string | null;
        level2At: Date | null;
        level2Comment: string | null;
        submittedAt: Date | null;
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
            url: string;
            id: string;
            category: string | null;
        }[];
    }>;
}
