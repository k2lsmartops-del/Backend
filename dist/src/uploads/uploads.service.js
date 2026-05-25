"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let UploadsService = class UploadsService {
    config;
    cloudName;
    apiKey;
    apiSecret;
    constructor(config) {
        this.config = config;
        this.cloudName = this.config.get('cloudinary.cloudName') || '';
        this.apiKey = this.config.get('cloudinary.apiKey') || '';
        this.apiSecret = this.config.get('cloudinary.apiSecret') || '';
    }
    generateSignature(userId, folder, publicId) {
        if (!this.apiSecret || !this.apiKey || !this.cloudName) {
            throw new common_1.InternalServerErrorException('Cloudinary non configuré (variables manquantes)');
        }
        const timestamp = Math.round(Date.now() / 1000);
        const uploadFolder = folder || `aip/${userId}`;
        const params = {
            folder: uploadFolder,
            timestamp,
        };
        if (publicId) {
            params.public_id = publicId;
        }
        const sortedParams = Object.keys(params)
            .sort()
            .map((key) => `${key}=${params[key]}`)
            .join('&');
        const signature = (0, crypto_1.createHash)('sha1')
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
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map