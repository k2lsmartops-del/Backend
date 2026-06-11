"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function addCommunes() {
    console.log('🏘️  Ajout des communes manquantes...');
    const newCommunes = [
        {
            name: 'Songon',
            quartiers: [
                'Songon-Agban', 'Songon-Dagbé', 'Songon-Kassemblé', 'Songon-Mbratté',
                'Songon-Agban Village', 'Songon-Téké', 'Abadjin-Kouté', 'Abadjin-Doumé',
            ],
        },
        {
            name: 'Anyama',
            quartiers: [
                'Anyama-Adjamé', 'Anyama-Gare', 'RAN', 'Anyama-Zossonkoi',
                'Anyama-Ebimpé', 'PK18', 'Anyama-Ahouabo', 'Anyama-Braffedon',
            ],
        },
        {
            name: 'Bingerville',
            quartiers: [
                'Bingerville-Centre', 'Cité Batim', 'Cité Siporex', 'Gbagba',
                'Akouai-Santé', 'Eloka', 'Adjamé-Bingerville', 'Cité Résidentielle',
            ],
        },
    ];
    try {
        let communesCreated = 0;
        let quartiersCreated = 0;
        for (const c of newCommunes) {
            const commune = await prisma.commune.upsert({
                where: { name: c.name },
                update: {},
                create: { name: c.name },
            });
            const isNew = commune.createdAt.getTime() > Date.now() - 5000;
            if (isNew) {
                communesCreated++;
                console.log(`✅ Commune créée: ${c.name}`);
            }
            else {
                console.log(`ℹ️  Commune existante: ${c.name}`);
            }
            for (const q of c.quartiers) {
                const quartier = await prisma.quartier.upsert({
                    where: { name_communeId: { name: q, communeId: commune.id } },
                    update: {},
                    create: { name: q, communeId: commune.id },
                });
                const isNewQ = quartier.createdAt.getTime() > Date.now() - 5000;
                if (isNewQ) {
                    quartiersCreated++;
                    console.log(`   + Quartier: ${q}`);
                }
            }
        }
        console.log('');
        console.log('📊 Résumé:');
        console.log(`   - ${communesCreated} commune(s) créée(s)`);
        console.log(`   - ${quartiersCreated} quartier(s) créé(s)`);
        console.log('✨ Terminé!');
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
addCommunes();
//# sourceMappingURL=add-communes.js.map