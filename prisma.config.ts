// Configuration Prisma 7 — AIP Terrain
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    // ── Pooling Supabase (Supavisor) ──
    // Les MIGRATIONS Prisma exigent une connexion DIRECTE (port 5432) : elles
    // ne fonctionnent pas à travers le pooler transactionnel (6543), qui ne
    // supporte ni les statements préparés persistants ni le verrouillage de
    // schéma. On utilise donc DIRECT_URL ici. Au RUNTIME, l'app passe par
    // l'adapter PrismaPg avec DATABASE_URL (URL pooled 6543) — voir
    // src/prisma/prisma.service.ts. Fallback sur DATABASE_URL en dev local
    // (où il n'y a pas de pooler).
    url: process.env['DIRECT_URL'] || process.env['DATABASE_URL'],
  },
});
