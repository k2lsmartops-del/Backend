import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Mapping ancien nom → nouveau nom
const RENAME_MAP: Record<string, string> = {
  'YOPOUGON-SONGON': 'YOPOUGON & SONGON',
  'ADJAME-ATTECOUBE': 'ADJAME & ATTECOUBE',
  'ABOBO-ANYAMA': 'ABOBO & ANYAMA',
  'COCODY-BINGERVILLE': 'COCODY & BINGERVILLE',
  'TREICHVILLE-MARCORY': 'TREICHVILLE & MARCORY',
  'PORT-BOUET-KOUMASSI': 'PORT-BOUET & KOUMASSI',
};

async function main() {
  console.log('🔄 Début du renommage des clusters...\n');

  const clusters = await prisma.cluster.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  console.log(`📋 Clusters trouvés en base : ${clusters.length}`);
  clusters.forEach(c => console.log(`   - ${c.name} (id: ${c.id})`));
  console.log('');

  let renamed = 0;
  let skipped = 0;

  for (const cluster of clusters) {
    const newName = RENAME_MAP[cluster.name];

    if (!newName) {
      console.log(`⏭️  ${cluster.name} : pas dans le mapping, ignoré`);
      skipped++;
      continue;
    }

    // Vérifier que le nouveau nom n'existe pas déjà (contrainte unique)
    const existing = await prisma.cluster.findUnique({
      where: { name: newName },
      select: { id: true },
    });

    if (existing && existing.id !== cluster.id) {
      console.log(`⚠️  ${cluster.name} → ${newName} : conflit, ${newName} existe déjà`);
      skipped++;
      continue;
    }

    if (existing && existing.id === cluster.id) {
      console.log(`✓ ${cluster.name} déjà renommé en ${newName}, rien à faire`);
      continue;
    }

    await prisma.cluster.update({
      where: { id: cluster.id },
      data: { name: newName },
    });

    console.log(`✅ ${cluster.name} → ${newName}`);
    renamed++;
  }

  console.log(`\n📊 Résultat : ${renamed} renommé(s), ${skipped} ignoré(s)`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
