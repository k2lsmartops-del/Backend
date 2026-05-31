export declare class BulkImportRowDto {
    role: string;
    fullName: string;
    phone: string;
    email?: string;
    password?: string;
    zone?: string;
    secteur?: string;
    supervisorPhone?: string;
}
export declare class BulkImportDto {
    rows: BulkImportRowDto[];
}
