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
exports.SubmissionsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const submissions_service_1 = require("./submissions.service");
const create_submission_dto_1 = require("./dto/create-submission.dto");
const update_submission_dto_1 = require("./dto/update-submission.dto");
const query_submissions_dto_1 = require("./dto/query-submissions.dto");
const sync_submission_dto_1 = require("./dto/sync-submission.dto");
const validate_submission_dto_1 = require("./dto/validate-submission.dto");
const reject_submission_dto_1 = require("./dto/reject-submission.dto");
let SubmissionsController = class SubmissionsController {
    submissionsService;
    constructor(submissionsService) {
        this.submissionsService = submissionsService;
    }
    create(dto, user) {
        return this.submissionsService.create(dto, user);
    }
    sync(dto, user) {
        return this.submissionsService.syncBatch(dto.submissions, user);
    }
    getStats(user, clusterId, period) {
        return this.submissionsService.getStats(user, clusterId, period || 'day');
    }
    findAll(query, user) {
        return this.submissionsService.findAll(query, user);
    }
    checkEditable(id, user) {
        return this.submissionsService.checkEditable(id, user);
    }
    findOne(id, user) {
        return this.submissionsService.findOne(id, user);
    }
    update(id, dto, user) {
        return this.submissionsService.update(id, dto, user);
    }
    remove(id, user) {
        return this.submissionsService.remove(id, user);
    }
    validate(id, dto, user) {
        return this.submissionsService.validate(id, user, dto?.comment);
    }
    reject(id, dto, user) {
        return this.submissionsService.reject(id, user, dto.comment);
    }
};
exports.SubmissionsController = SubmissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.COMMERCIAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_submission_dto_1.CreateSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "create", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 200, ttl: 60000 } }),
    (0, common_1.Post)('sync'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMMERCIAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sync_submission_dto_1.SyncSubmissionsDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "sync", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 200, ttl: 60000 } }),
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATEUR, client_1.Role.SUPERVISEUR, client_1.Role.CLIENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('clusterId')),
    __param(2, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getStats", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 200, ttl: 60000 } }),
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATEUR, client_1.Role.SUPERVISEUR, client_1.Role.COMMERCIAL, client_1.Role.CLIENT),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_submissions_dto_1.QuerySubmissionsDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/check-editable'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMMERCIAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "checkEditable", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMMERCIAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_submission_dto_1.UpdateSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMMERCIAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/validate'),
    (0, roles_decorator_1.Roles)(client_1.Role.COORDINATEUR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validate_submission_dto_1.ValidateSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "validate", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)(client_1.Role.COORDINATEUR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_submission_dto_1.RejectSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "reject", null);
exports.SubmissionsController = SubmissionsController = __decorate([
    (0, common_1.Controller)('submissions'),
    __metadata("design:paramtypes", [submissions_service_1.SubmissionsService])
], SubmissionsController);
//# sourceMappingURL=submissions.controller.js.map