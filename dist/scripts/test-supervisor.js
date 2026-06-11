"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt_1 = require("bcrypt");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function testSupervisor() {
    console.log('👤 Création d\'un superviseur de test...');
    try {
        const password = await (0, bcrypt_1.hash)('password123', 10);
        const supervisor = await prisma.user.create({
            data: {
                matricule: 'SUP-TEST-001',
                fullName: 'Superviseur Test',
                phone: '0700000099',
                email: 'superviseur@test.ci',
                password,
                role: 'SUPERVISEUR',
                status: 'ACTIF',
                isActive: true,
            },
        });
        console.log(`✅ Superviseur créé :`);
        console.log(`   - ID: ${supervisor.id}`);
        console.log(`   - Nom: ${supervisor.fullName}`);
        console.log(`   - Matricule: ${supervisor.matricule}`);
        console.log(`   - Téléphone: ${supervisor.phone}`);
        console.log('');
        console.log('⏳ Suppression du superviseur dans 3 secondes...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await prisma.user.delete({
            where: { id: supervisor.id },
        });
        console.log(`✅ Superviseur supprimé : ${supervisor.fullName}`);
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testSupervisor();
//# sourceMappingURL=test-supervisor.js.map