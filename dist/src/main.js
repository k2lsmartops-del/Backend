"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)({
        threshold: 1024,
        level: 6,
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
    }));
    const allowedOrigins = [
        'http://localhost:5173',
        'https://frontend-taupe-two-91.vercel.app',
        'https://www.k2lsmartops.com',
        process.env.FRONTEND_URL,
    ].filter(Boolean);
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`Application démarrée sur le port ${port}`);
    logger.log('Security headers enabled (helmet)');
    logger.log('Compression enabled (gzip, threshold=1KB, level=6)');
    logger.log('Rate limiting enabled (60/min par IP)');
    logger.log('Cache enabled (TTL=5min) — KPIs dashboard');
}
void bootstrap();
//# sourceMappingURL=main.js.map