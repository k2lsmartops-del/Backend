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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClustersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const clusters_service_1 = require("./clusters.service");
const create_cluster_dto_1 = require("./dto/create-cluster.dto");
const update_cluster_dto_1 = require("./dto/update-cluster.dto");
const assign_supervisor_dto_1 = require("./dto/assign-supervisor.dto");
let ClustersController = class ClustersController {
    clustersService;
    constructor(clustersService) {
        this.clustersService = clustersService;
    }
    create(dto) {
        return this.clustersService.create(dto);
    }
    findAll(user) {
        return this.clustersService.findAllFiltered(user);
    }
    findOne(id) {
        return this.clustersService.findOne(id);
    }
    update(id, dto) {
        return this.clustersService.update(id, dto);
    }
    assignSupervisor(clusterId, dto) {
        return this.clustersService.assignSupervisor(clusterId, dto.supervisorId);
    }
    removeSupervisor(clusterId) {
        return this.clustersService.removeSupervisor(clusterId);
    }
    remove(id) {
        return this.clustersService.remove(id);
    }
};
exports.ClustersController = ClustersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATEUR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cluster_dto_1.CreateClusterDto]),
    __metadata("design:returntype", void 0)
], ClustersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATEUR, client_1.Role.SUPERVISEUR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClustersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATEUR, client_1.Role.SUPERVISEUR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClustersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATEUR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cluster_dto_1.UpdateClusterDto]),
    __metadata("design:returntype", void 0)
], ClustersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/supervisor'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_supervisor_dto_1.AssignSupervisorDto]),
    __metadata("design:returntype", void 0)
], ClustersController.prototype, "assignSupervisor", null);
__decorate([
    (0, common_1.Delete)(':id/supervisor'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClustersController.prototype, "removeSupervisor", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClustersController.prototype, "remove", null);
exports.ClustersController = ClustersController = __decorate([
    (0, common_1.Controller)('clusters'),
    __metadata("design:paramtypes", [clusters_service_1.ClustersService])
], ClustersController);
//# sourceMappingURL=clusters.controller.js.map