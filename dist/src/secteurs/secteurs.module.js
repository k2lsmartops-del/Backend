"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecteursModule = void 0;
const common_1 = require("@nestjs/common");
const secteurs_controller_1 = require("./secteurs.controller");
const secteurs_service_1 = require("./secteurs.service");
let SecteursModule = class SecteursModule {
};
exports.SecteursModule = SecteursModule;
exports.SecteursModule = SecteursModule = __decorate([
    (0, common_1.Module)({
        controllers: [secteurs_controller_1.SecteursController],
        providers: [secteurs_service_1.SecteursService],
        exports: [secteurs_service_1.SecteursService],
    })
], SecteursModule);
//# sourceMappingURL=secteurs.module.js.map