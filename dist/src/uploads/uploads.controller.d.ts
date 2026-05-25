import { User } from '@prisma/client';
import { UploadsService } from './uploads.service';
import { SignatureRequestDto } from './dto/signature-request.dto';
export declare class UploadsController {
    private uploadsService;
    constructor(uploadsService: UploadsService);
    getSignature(dto: SignatureRequestDto, user: Omit<User, 'password'>): {
        signature: string;
        timestamp: number;
        cloudName: string;
        apiKey: string;
        folder: string;
        publicId: string | undefined;
        uploadUrl: string;
    };
}
