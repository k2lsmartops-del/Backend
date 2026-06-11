"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function deleteSupervisor() {
    console.log('🗑️ Suppression du superviseur de test...');
    try {
        const deleted = await prisma.user.deleteMany({
            where: {
                matricule: 'SUP-TEST-001',
            },
        });
        console.log(`✅ ${deleted.count} superviseur(s) supprimé(s)`);
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
deleteSupervisor();
//# sourceMappingURL=delete-supervisor.js.map