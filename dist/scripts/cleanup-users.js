"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function cleanupUsers() {
    console.log('🗑️  Début du nettoyage de la base de données...');
    try {
        const usersToDelete = await prisma.user.findMany({
            where: {
                role: {
                    not: client_1.Role.ADMIN,
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
        const userIds = usersToDelete.map((u) => u.id);
        const deletedSubmissions = await prisma.submission.deleteMany({
            where: {
                commercialId: {
                    in: userIds,
                },
            },
        });
        console.log(`✅ Soumissions supprimées: ${deletedSubmissions.count}`);
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    not: client_1.Role.ADMIN,
                },
            },
        });
        console.log(`✅ Utilisateurs supprimés: ${deletedUsers.count}`);
        const remainingAdmins = await prisma.user.findMany({
            where: {
                role: client_1.Role.ADMIN,
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
    }
    catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
cleanupUsers()
    .then(() => {
    console.log('🎉 Script terminé');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Script échoué:', error);
    process.exit(1);
});
//# sourceMappingURL=cleanup-users.js.map