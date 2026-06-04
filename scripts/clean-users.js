// Script pour supprimer tous les utilisateurs sauf ADMIN
// Utilise Prisma pour éviter les problèmes de noms de tables

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanUsers() {
  console.log('🗑️  Suppression de tous les utilisateurs sauf ADMIN...\n');

  try {
    // 1. Casser l'auto-référence users.supervisorId
    console.log('1. Suppression des références supervisorId...');
    const updateSupervisors = await prisma.user.updateMany({
      where: {
        matricule: { not: 'ADM-001' },
      },
      data: {
        supervisorId: null,
      },
    });
    console.log(`   ✓ ${updateSupervisors.count} utilisateurs mis à jour\n`);

    // 2. Supprimer les données transactionnelles
    console.log('2. Suppression des données transactionnelles...');
    
    const deletePhotos = await prisma.photo.deleteMany({});
    console.log(`   ✓ ${deletePhotos.count} photos supprimées`);
    
    const deleteValidationHistory = await prisma.validationHistory.deleteMany({});
    console.log(`   ✓ ${deleteValidationHistory.count} historiques de validation supprimés`);
    
    const deleteSubmissions = await prisma.submission.deleteMany({});
    console.log(`   ✓ ${deleteSubmissions.count} soumissions supprimées`);
    
    // Récupérer les IDs des utilisateurs à supprimer
    const usersToDelete = await prisma.user.findMany({
      where: { matricule: { not: 'ADM-001' } },
      select: { id: true },
    });
    const userIds = usersToDelete.map(u => u.id);
    
    const deleteTokens = await prisma.refreshToken.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(`   ✓ ${deleteTokens.count} refresh tokens supprimés\n`);

    // 3. Nettoyer les références dans les master data
    console.log('3. Nettoyage des références dans les zones et secteurs...');
    
    const updateSecteurs = await prisma.secteur.updateMany({
      where: { supervisorId: { in: userIds } },
      data: { supervisorId: null },
    });
    console.log(`   ✓ ${updateSecteurs.count} secteurs mis à jour`);
    
    const updateZones = await prisma.zone.updateMany({
      where: { coordinatorId: { in: userIds } },
      data: { coordinatorId: null },
    });
    console.log(`   ✓ ${updateZones.count} zones mises à jour\n`);

    // 4. Supprimer les users (sauf admin)
    console.log('4. Suppression des utilisateurs...');
    const deleteUsers = await prisma.user.deleteMany({
      where: { matricule: { not: 'ADM-001' } },
    });
    console.log(`   ✓ ${deleteUsers.count} utilisateurs supprimés\n`);

    // Vérification
    console.log('✅ Nettoyage terminé !\n');
    const remainingUsers = await prisma.user.findMany({
      select: { matricule: true, fullName: true, role: true },
    });
    
    console.log('Utilisateurs restants:');
    remainingUsers.forEach(user => {
      console.log(`  - ${user.matricule}: ${user.fullName} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUsers();
