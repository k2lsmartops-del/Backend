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
exports.CreateSecteurDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSecteurDto {
    name;
    zoneId;
    quartierIds;
    supervisorId;
}
exports.CreateSecteurDto = CreateSecteurDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom du secteur est requis' }),
    __metadata("design:type", String)
], CreateSecteurDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'ID de zone invalide' }),
    __metadata("design:type", String)
], CreateSecteurDto.prototype, "zoneId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'IDs de quartiers invalides' }),
    __metadata("design:type", Array)
], CreateSecteurDto.prototype, "quartierIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'ID de superviseur invalide' }),
    __metadata("design:type", String)
], CreateSecteurDto.prototype, "supervisorId", void 0);
//# sourceMappingURL=create-secteur.dto.js.map