import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // ── Compression HTTP (gzip) ──
  // Réduit la taille des réponses JSON pour les commerciaux en 3G médiocre.
  // threshold 1024 : on ne compresse pas les réponses < 1 KB (le coût CPU
  // dépasserait le gain réseau). level 6 : compromis équilibré CPU/taux
  // (1 = rapide/peu compressé, 9 = lent/max). Transparent pour le frontend.
  app.use(
    compression({
      threshold: 1024,
      level: 6,
    }),
  );

  // Active la validation et transformation des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS: autorise le frontend local et en production
  const allowedOrigins = [
    'http://localhost:5173',
    'https://frontend-taupe-two-91.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // ── Logs de démarrage : confirment l'activation des optimisations ──
  const logger = new Logger('Bootstrap');
  logger.log(`Application démarrée sur le port ${port}`);
  logger.log('Compression enabled (gzip, threshold=1KB, level=6)');
  logger.log('Rate limiting enabled (60/min par IP)');
  logger.log('Cache enabled (TTL=5min) — KPIs dashboard');
}

void bootstrap();
