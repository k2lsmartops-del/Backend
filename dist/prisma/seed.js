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
    const zone = await prisma.zone.upsert({
        where: { name: 'Zone Abidjan-Sud' },
        update: {},
        create: {
            name: 'Zone Abidjan-Sud',
            description: 'Zone couvrant Marcory, Treichville, Port-Bouet',
        },
    });
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
    const coordinateur = await prisma.user.upsert({
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
            zoneId: zone.id,
        },
    });
    await prisma.zone.update({
        where: { id: zone.id },
        data: { coordinatorId: coordinateur.id },
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
            zoneId: zone.id,
        },
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
            zoneId: zone.id,
            supervisorId: superviseur.id,
        },
    });
    console.log('Seed termine - 4 utilisateurs crees');
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