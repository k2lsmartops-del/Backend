export declare class BulkImportRowDto {
    role: string;
    fullName: string;
    phone: string;
    email?: string;
    password?: string;
    cluster?: string;
    zone?: string;
    sponsorCode?: string;
    commune?: string;
    habitation?: string;
}
export declare class BulkImportDto {
    rows: BulkImportRowDto[];
}
