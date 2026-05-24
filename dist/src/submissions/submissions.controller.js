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
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const submissions_service_1 = require("./submissions.service");
const create_submission_dto_1 = require("./dto/create-submission.dto");
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
    findAll(query, user) {
        return this.submissionsService.findAll(query, user);
    }
    findOne(id, user) {
        return this.submissionsService.findOne(id, user);
    }
    approveLevel1(id, dto, user) {
        return this.submissionsService.approveLevel1(id, user, dto.comment);
    }
    rejectLevel1(id, dto, user) {
        return this.submissionsService.rejectLevel1(id, user, dto.comment);
    }
    approveLevel2(id, dto, user) {
        return this.submissionsService.approveLevel2(id, user, dto.comment);
    }
    rejectLevel2(id, dto, user) {
        return this.submissionsService.rejectLevel2(id, user, dto.comment);
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
    (0, common_1.Post)('sync'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMMERCIAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sync_submission_dto_1.SyncSubmissionsDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "sync", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_submissions_dto_1.QuerySubmissionsDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/approve-l1'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPERVISEUR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validate_submission_dto_1.ValidateSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "approveLevel1", null);
__decorate([
    (0, common_1.Patch)(':id/reject-l1'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPERVISEUR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_submission_dto_1.RejectSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "rejectLevel1", null);
__decorate([
    (0, common_1.Patch)(':id/approve-l2'),
    (0, roles_decorator_1.Roles)(client_1.Role.COORDINATEUR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validate_submission_dto_1.ValidateSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "approveLevel2", null);
__decorate([
    (0, common_1.Patch)(':id/reject-l2'),
    (0, roles_decorator_1.Roles)(client_1.Role.COORDINATEUR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_submission_dto_1.RejectSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "rejectLevel2", null);
exports.SubmissionsController = SubmissionsController = __decorate([
    (0, common_1.Controller)('submissions'),
    __metadata("design:paramtypes", [submissions_service_1.SubmissionsService])
], SubmissionsController);
//# sourceMappingURL=submissions.controller.js.map