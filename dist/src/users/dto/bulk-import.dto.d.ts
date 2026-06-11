export declare class BulkImportRowDto {
    role: string;
    fullName: string;
    phone: string;
    email?: string;
    password?: string;
    cluster?: string;
    zone?: string;
}
export declare class BulkImportDto {
    rows: BulkImportRowDto[];
}
