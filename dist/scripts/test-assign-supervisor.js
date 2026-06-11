"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function testAssignSupervisor() {
    console.log('🔍 Vérification de l\'état actuel...');
    try {
        const cluster = await prisma.cluster.findFirst({
            include: {
                supervisor: true,
                members: {
                    where: { role: 'COMMERCIAL' },
                    select: { id: true, fullName: true, supervisorId: true, clusterId: true },
                },
            },
        });
        if (!cluster) {
            console.log('❌ Aucun cluster trouvé');
            return;
        }
        console.log(`\n📍 Cluster: ${cluster.name} (ID: ${cluster.id})`);
        console.log(`   Superviseur: ${cluster.supervisor?.fullName || 'Aucun'} (ID: ${cluster.supervisor?.id})`);
        console.log(`   Membres (commerciaux): ${cluster.members.length}`);
        console.log('\n📋 État des commerciaux:');
        cluster.members.forEach((m) => {
            const hasSupervisor = m.supervisorId ? '✓' : '✗';
            const hasCluster = m.clusterId ? '✓' : '✗';
            console.log(`   ${hasSupervisor} ${hasCluster} ${m.fullName}`);
            console.log(`      - supervisorId: ${m.supervisorId || 'NULL'}`);
            console.log(`      - clusterId: ${m.clusterId || 'NULL'}`);
        });
        if (cluster.supervisor && cluster.members.length > 0) {
            const withoutSupervisor = cluster.members.filter((m) => !m.supervisorId);
            if (withoutSupervisor.length > 0) {
                console.log(`\n⚠️ ${withoutSupervisor.length} commerciaux sans supervisorId`);
                console.log('🔧 Correction automatique...');
                const result = await prisma.user.updateMany({
                    where: {
                        clusterId: cluster.id,
                        role: 'COMMERCIAL',
                    },
                    data: { supervisorId: cluster.supervisor.id },
                });
                console.log(`✅ ${result.count} commerciaux mis à jour`);
            }
        }
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testAssignSupervisor();
//# sourceMappingURL=test-assign-supervisor.js.map