import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function deleteSupervisor() {
  console.log('🗑️ Suppression du superviseur de test...');

  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        matricule: 'SUP-TEST-001',
      },
    });

    console.log(`✅ ${deleted.count} superviseur(s) supprimé(s)`);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSupervisor();
