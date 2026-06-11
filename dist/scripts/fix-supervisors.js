"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function fixSupervisors() {
    console.log('🔧 Correction des rattachements superviseur → commerciaux...\n');
    try {
        const clusters = await prisma.cluster.findMany({
            where: { supervisorId: { not: null } },
            include: {
                supervisor: { select: { id: true, fullName: true } },
                members: {
                    where: { role: 'COMMERCIAL' },
                    select: { id: true, fullName: true, supervisorId: true },
                },
            },
        });
        console.log(`📍 ${clusters.length} cluster(s) avec superviseur(s) trouvé(s)\n`);
        let totalUpdated = 0;
        for (const cluster of clusters) {
            const commerciauxWithoutSupervisor = cluster.members.filter((m) => !m.supervisorId);
            if (commerciauxWithoutSupervisor.length > 0) {
                console.log(`📋 Cluster: ${cluster.name}`);
                console.log(`   Superviseur: ${cluster.supervisor?.fullName}`);
                console.log(`   Commerciaux à corriger: ${commerciauxWithoutSupervisor.length}`);
                const result = await prisma.user.updateMany({
                    where: {
                        clusterId: cluster.id,
                        role: 'COMMERCIAL',
                    },
                    data: { supervisorId: cluster.supervisorId },
                });
                console.log(`   ✅ ${result.count} commerciaux mis à jour\n`);
                totalUpdated += result.count;
            }
            else {
                console.log(`✓ Cluster: ${cluster.name} - déjà à jour\n`);
            }
        }
        console.log(`🎉 Correction terminée: ${totalUpdated} commerciaux mis à jour au total`);
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixSupervisors();
//# sourceMappingURL=fix-supervisors.js.map