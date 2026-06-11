import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function cleanupUsers() {
  console.log('🗑️  Début du nettoyage de la base de données...');

  try {
    // Récupérer tous les utilisateurs sauf les admins
    const usersToDelete = await prisma.user.findMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
      },
      select: {
        id: true,
        matricule: true,
        fullName: true,
        role: true,
      },
    });

    console.log(`📊 Utilisateurs à supprimer: ${usersToDelete.length}`);

    // Supprimer les soumissions liées à ces utilisateurs
    const userIds = usersToDelete.map((u) => u.id);
    const deletedSubmissions = await prisma.submission.deleteMany({
      where: {
        commercialId: {
          in: userIds,
        },
      },
    });
    console.log(`✅ Soumissions supprimées: ${deletedSubmissions.count}`);

    // Supprimer les utilisateurs
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
      },
    });
    console.log(`✅ Utilisateurs supprimés: ${deletedUsers.count}`);

    // Afficher les admins restants
    const remainingAdmins = await prisma.user.findMany({
      where: {
        role: Role.ADMIN,
      },
      select: {
        id: true,
        matricule: true,
        fullName: true,
        email: true,
      },
    });
    console.log(`👑 Admins conservés: ${remainingAdmins.length}`);
    remainingAdmins.forEach((admin) => {
      console.log(`   - ${admin.matricule} (${admin.fullName}) - ${admin.email}`);
    });

    console.log('✨ Nettoyage terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanupUsers()
  .then(() => {
    console.log('🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script échoué:', error);
    process.exit(1);
  });
