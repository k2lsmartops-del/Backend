import { PhotoCategory } from '@prisma/client';
export declare class PhotoDto {
    cloudinaryPublicId: string;
    url: string;
    category: PhotoCategory;
    width?: number;
    height?: number;
    bytes?: number;
}
