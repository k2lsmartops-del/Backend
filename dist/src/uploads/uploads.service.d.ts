import { ConfigService } from '@nestjs/config';
export declare class UploadsService {
    private config;
    private readonly cloudName;
    private readonly apiKey;
    private readonly apiSecret;
    constructor(config: ConfigService);
    generateSignature(userId: string, folder?: string, publicId?: string): {
        signature: string;
        timestamp: number;
        cloudName: string;
        apiKey: string;
        folder: string;
        publicId: string | undefined;
        uploadUrl: string;
    };
}
