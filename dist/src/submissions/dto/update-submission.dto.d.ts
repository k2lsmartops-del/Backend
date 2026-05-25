import { SubmissionType } from '@prisma/client';
import { PhotoDto } from './photo.dto';
export declare class UpdateSubmissionDto {
    type?: SubmissionType;
    commune?: string;
    quartier?: string;
    addressNote?: string;
    latitude?: number;
    longitude?: number;
    gpsAccuracy?: number;
    gpsCapturedAt?: string;
    prospectFullName?: string;
    prospectPhone?: string;
    prospectProfession?: string;
    prospectGender?: string;
    prospectAge?: string;
    appStatus?: string;
    phoneType?: string;
    bankAccount?: string;
    observations?: string;
    merchantName?: string;
    merchantOwner?: string;
    merchantPhone?: string;
    merchantActivity?: string;
    merchantRccm?: string;
    photos?: PhotoDto[];
}
