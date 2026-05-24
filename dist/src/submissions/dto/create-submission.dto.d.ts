import { AppStatus, SubmissionType, SyncStatus } from '@prisma/client';
export declare class CreateSubmissionDto {
    type: SubmissionType;
    clientUuid: string;
    latitude?: number;
    longitude?: number;
    gpsAccuracy?: number;
    gpsCapturedAt?: string;
    commune: string;
    quartier?: string;
    addressNote?: string;
    prospectFullName?: string;
    prospectPhone?: string;
    prospectGender?: string;
    prospectAge?: number;
    appStatus?: AppStatus;
    phoneType?: string;
    bankAccount?: string;
    observations?: string;
    merchantName?: string;
    merchantOwner?: string;
    merchantPhone?: string;
    merchantActivity?: string;
    merchantRccm?: string;
    createdOffline?: boolean;
    syncStatus?: SyncStatus;
}
