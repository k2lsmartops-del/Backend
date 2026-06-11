import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function verifySupervisors() {
  console.log('🔍 Vérification de tous les commerciaux...\n');

  try {
    const clusters = await prisma.cluster.findMany({
      include: {
        supervisor: { select: { id: true, fullName: true } },
        members: {
          where: { role: 'COMMERCIAL' },
          select: { id: true, fullName: true, supervisorId: true, clusterId: true },
        },
      },
    });

    let totalCommerciaux = 0;
    let totalAvecSupervisor = 0;
    let totalSansSupervisor = 0;

    for (const cluster of clusters) {
      const commerciaux = cluster.members;
      totalCommerciaux += commerciaux.length;

      const avecSupervisor = commerciaux.filter((m) => m.supervisorId);
      const sansSupervisor = commerciaux.filter((m) => !m.supervisorId);

      totalAvecSupervisor += avecSupervisor.length;
      totalSansSupervisor += sansSupervisor.length;

      console.log(`📍 Cluster: ${cluster.name}`);
      console.log(`   Superviseur: ${cluster.supervisor?.fullName || 'Aucun'}`);
      console.log(`   Commerciaux: ${commerciaux.length}`);
      console.log(`   ✓ Avec supervisorId: ${avecSupervisor.length}`);
      console.log(`   ✗ Sans supervisorId: ${sansSupervisor.length}`);

      if (sansSupervisor.length > 0) {
        console.log(`   ⚠️ Commerciaux sans superviseur:`);
        sansSupervisor.forEach((m) => {
          console.log(`      - ${m.fullName}`);
        });
      }
      console.log('');
    }

    console.log('📊 RÉSUMÉ GLOBAL:');
    console.log(`   Total commerciaux: ${totalCommerciaux}`);
    console.log(`   ✓ Avec supervisorId: ${totalAvecSupervisor}`);
    console.log(`   ✗ Sans supervisorId: ${totalSansSupervisor}`);

    if (totalSansSupervisor === 0) {
      console.log('\n✅ TOUS les commerciaux ont un supervisorId !');
    } else {
      console.log(`\n⚠️ ${totalSansSupervisor} commerciaux sans supervisorId`);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySupervisors();
