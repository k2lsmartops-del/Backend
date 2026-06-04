"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const compression_1 = __importDefault(require("compression"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
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
    logger.log('Compression enabled (gzip, threshold=1KB, level=6)');
    logger.log('Rate limiting enabled (60/min par IP)');
    logger.log('Cache enabled (TTL=5min) — KPIs dashboard');
}
void bootstrap();
//# sourceMappingURL=main.js.map