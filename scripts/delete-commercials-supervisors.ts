import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function deleteCommercialsAndSupervisors() {
  console.log('🗑️  Début de la suppression des commerciaux et superviseurs...\n');

  try {
    // Récupérer tous les commerciaux et superviseurs
    const usersToDelete = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.COMMERCIAL, Role.SUPERVISEUR],
        },
      },
      select: {
        id: true,
        matricule: true,
        fullName: true,
        role: true,
      },
    });

    console.log(`📊 Commerciaux et superviseurs à supprimer: ${usersToDelete.length}`);

    // Afficher la liste des utilisateurs à supprimer
    if (usersToDelete.length > 0) {
      console.log('\nListe des utilisateurs à supprimer:');
      usersToDelete.forEach((user) => {
        console.log(`  - [${user.role}] ${user.matricule}: ${user.fullName}`);
      });
      console.log('');
    }

    // Récupérer les IDs des utilisateurs à supprimer
    const userIds = usersToDelete.map((u) => u.id);

    // Supprimer les soumissions liées à ces utilisateurs
    const deletedSubmissions = await prisma.submission.deleteMany({
      where: {
        commercialId: {
          in: userIds,
        },
      },
    });
    console.log(`✅ Soumissions supprimées: ${deletedSubmissions.count}`);

    // Supprimer les photos liées aux soumissions
    const deletedPhotos = await prisma.photo.deleteMany({});
    console.log(`✅ Photos supprimées: ${deletedPhotos.count}`);

    // Supprimer les historiques de validation
    const deletedValidationHistory = await prisma.validationHistory.deleteMany({});
    console.log(`✅ Historiques de validation supprimés: ${deletedValidationHistory.count}`);

    // Supprimer les refresh tokens
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
    console.log(`✅ Refresh tokens supprimés: ${deletedTokens.count}`);

    // Nettoyer les superviseurs assignés aux clusters
    const updatedClusters = await prisma.cluster.updateMany({
      where: {
        supervisorId: {
          in: userIds,
        },
      },
      data: {
        supervisorId: null,
      },
    });
    console.log(`✅ Clusters mis à jour (supervisorId null): ${updatedClusters.count}`);

    // Nettoyer les superviseurs assignés aux utilisateurs
    const updatedUsers = await prisma.user.updateMany({
      where: {
        supervisorId: {
          in: userIds,
        },
      },
      data: {
        supervisorId: null,
      },
    });
    console.log(`✅ Utilisateurs mis à jour (supervisorId null): ${updatedUsers.count}`);

    // Supprimer les commerciaux et superviseurs
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          in: [Role.COMMERCIAL, Role.SUPERVISEUR],
        },
      },
    });
    console.log(`✅ Utilisateurs supprimés: ${deletedUsers.count}`);

    // Afficher les utilisateurs restants
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        matricule: true,
        fullName: true,
        role: true,
        email: true,
      },
    });
    console.log(`\n👥 Utilisateurs restants: ${remainingUsers.length}`);
    remainingUsers.forEach((user) => {
      console.log(`   - [${user.role}] ${user.matricule}: ${user.fullName} ${user.email ? `(${user.email})` : ''}`);
    });

    console.log('\n✨ Suppression terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
deleteCommercialsAndSupervisors()
  .then(() => {
    console.log('🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script échoué:', error);
    process.exit(1);
  });
