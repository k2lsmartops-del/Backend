import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

/**
 * Service de génération de signatures Cloudinary.
 * Le frontend upload directement vers Cloudinary avec cette signature.
 * L'API ne traite JAMAIS de fichier binaire — uniquement du JSON.
 */
@Injectable()
export class UploadsService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private config: ConfigService) {
    this.cloudName = this.config.get<string>('cloudinary.cloudName') || '';
    this.apiKey = this.config.get<string>('cloudinary.apiKey') || '';
    this.apiSecret = this.config.get<string>('cloudinary.apiSecret') || '';
  }

  /**
   * Génère une signature pour un upload signé vers Cloudinary.
   * Retourne tout ce dont le frontend a besoin pour uploader directement.
   */
  generateSignature(userId: string, folder?: string, publicId?: string) {
    if (!this.apiSecret || !this.apiKey || !this.cloudName) {
      throw new InternalServerErrorException(
        'Cloudinary non configuré (variables manquantes)',
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const uploadFolder = folder || `aip/${userId}`;

    // Paramètres à signer (ordre alphabétique, sans api_key ni file)
    const params: Record<string, string | number> = {
      folder: uploadFolder,
      timestamp,
    };
    if (publicId) {
      params.public_id = publicId;
    }

    // Construire la chaîne à signer : clé=valeur&clé=valeur + apiSecret
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const signature = createHash('sha1')
      .update(sortedParams + this.apiSecret)
      .digest('hex');

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder: uploadFolder,
      publicId: publicId || undefined,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }
}
