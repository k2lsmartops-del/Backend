"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
require("dotenv/config");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const password = await bcrypt.hash('password123', 10);
    await prisma.user.upsert({
        where: { phone: '0700000001' },
        update: {},
        create: {
            matricule: 'ADM-001',
            fullName: 'Admin K2L',
            phone: '0700000001',
            email: 'admin@k2l.ci',
            password,
            role: client_1.Role.ADMIN,
            status: client_1.AgentStatus.ACTIF,
            isActive: true,
        },
    });
    await prisma.user.upsert({
        where: { phone: '0700000002' },
        update: {},
        create: {
            matricule: 'COORD-001',
            fullName: 'Kouame Jean (Coordinateur)',
            phone: '0700000002',
            email: 'coord@k2l.ci',
            password,
            role: client_1.Role.COORDINATEUR,
            status: client_1.AgentStatus.ACTIF,
            isActive: true,
        },
    });
    const cluster = await prisma.cluster.upsert({
        where: { name: 'Cluster Abidjan-Sud' },
        update: {},
        create: {
            name: 'Cluster Abidjan-Sud',
            description: 'Cluster couvrant Marcory, Treichville, Port-Bouet',
        },
    });
    const superviseur = await prisma.user.upsert({
        where: { phone: '0700000003' },
        update: {},
        create: {
            matricule: 'SUP-001',
            fullName: 'Traore Fatou (Superviseur)',
            phone: '0700000003',
            email: 'sup@k2l.ci',
            password,
            role: client_1.Role.SUPERVISEUR,
            status: client_1.AgentStatus.ACTIF,
            isActive: true,
            clusterId: cluster.id,
        },
    });
    await prisma.cluster.update({
        where: { id: cluster.id },
        data: { supervisorId: superviseur.id },
    });
    await prisma.user.upsert({
        where: { phone: '0700000004' },
        update: {},
        create: {
            matricule: 'AGT-001',
            fullName: 'Diallo Ibrahim (Commercial)',
            phone: '0700000004',
            email: 'agent@k2l.ci',
            password,
            role: client_1.Role.COMMERCIAL,
            status: client_1.AgentStatus.ACTIF,
            isActive: true,
            clusterId: cluster.id,
            supervisorId: superviseur.id,
        },
    });
    const communesData = [
        {
            name: 'Yopougon',
            quartiers: [
                'Sicogi', 'Selmer', 'Wassakara', 'Niangon', 'Sideci',
                'Toits Rouges', 'Banco', 'Azito', 'Port-Bouet 2', 'Koweït',
                'Millionnaire', 'Andokoi', 'Maroc', 'Lievre Rouge',
            ],
        },
        {
            name: 'Cocody',
            quartiers: [
                'Angré', 'Riviera 2', 'Riviera 3', 'Riviera Faya', 'Bonoumin',
                'Danga', 'II Plateaux', 'Vallon', 'Attoban', 'Palmeraie',
                'Blockauss', 'Ambassade', 'Saint-Jean', 'Feh Kessé',
            ],
        },
        {
            name: 'Marcory',
            quartiers: [
                'Zone 4', 'Biétry', 'Anoumabo', 'Résidentiel', 'Zone 3',
            ],
        },
        {
            name: 'Treichville',
            quartiers: [
                'Avenue 12', 'Avenue 17', 'Gare de Bassam', 'Habitat', 'Nanan Yamousso',
            ],
        },
        {
            name: 'Plateau',
            quartiers: [
                'Commerce', 'Cathédrale', 'Indénié', 'Adjamé-Gare',
            ],
        },
        {
            name: 'Abobo',
            quartiers: [
                'Abobo-Gare', 'PK18', 'Avocatier', 'Sagbé', 'Anador',
                'Kennedy', 'Baoulé', 'Banco Nord', 'Anonkoua-Kouté',
            ],
        },
        {
            name: 'Adjamé',
            quartiers: [
                'Liberté', 'Bracodi', 'Williamsville', '220 logements', 'Forum',
            ],
        },
        {
            name: 'Port-Bouët',
            quartiers: [
                'Vridi', 'Gonzagueville', 'Jean Folly', 'Aéroport', 'Derrière-Wharf',
            ],
        },
        {
            name: 'Koumassi',
            quartiers: [
                'Remblais', 'Grand campement', 'Sopim', 'Zone industrielle', 'Sicogi',
            ],
        },
        {
            name: 'Attécoubé',
            quartiers: [
                'Agban', 'Locodjro', 'Santé', 'Abobo-Doumé', 'Boribana',
            ],
        },
    ];
    for (const c of communesData) {
        const commune = await prisma.commune.upsert({
            where: { name: c.name },
            update: {},
            create: { name: c.name },
        });
        for (const q of c.quartiers) {
            await prisma.quartier.upsert({
                where: { name_communeId: { name: q, communeId: commune.id } },
                update: {},
                create: { name: q, communeId: commune.id },
            });
        }
    }
    console.log(`Seed terminé :`);
    console.log(`  - ${communesData.length} communes`);
    console.log(`  - ${communesData.reduce((s, c) => s + c.quartiers.length, 0)} quartiers`);
    console.log('  - 4 utilisateurs');
    console.log('');
    console.log('IDENTIFIANTS DE CONNEXION (mot de passe: password123)');
    console.log('  Admin        -> 0700000001');
    console.log('  Coordinateur -> 0700000002');
    console.log('  Superviseur  -> 0700000003');
    console.log('  Commercial   -> 0700000004');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map