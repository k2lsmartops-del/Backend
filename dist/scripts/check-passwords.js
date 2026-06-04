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
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function checkPasswords() {
    console.log('\n=== VERIFICATION MOTS DE PASSE ===\n');
    const testCases = [
        { phone: '0700000002', expectedPwd: 'Passw0rd2', name: 'Kouadio Kouassi' },
        { phone: '0700000003', expectedPwd: 'Passw0rd3', name: 'Konan Koffi' },
        { phone: '0700000004', expectedPwd: 'Passw0rd4', name: 'Yao Adjoua' },
        { phone: '0700000176', expectedPwd: 'Passw0rd267', name: 'Akoua Coulibaly' },
    ];
    for (const test of testCases) {
        console.log(`\n--- ${test.name} (${test.phone}) ---`);
        const user = await prisma.user.findFirst({
            where: { phone: test.phone },
            select: {
                id: true,
                phone: true,
                matricule: true,
                fullName: true,
                password: true,
                isActive: true,
                status: true,
            },
        });
        if (!user) {
            console.log('❌ Utilisateur NON TROUVÉ dans la base');
            console.log(`   → Le téléphone "${test.phone}" n'existe pas`);
            continue;
        }
        console.log(`✓ Utilisateur trouvé:`);
        console.log(`  Matricule: ${user.matricule}`);
        console.log(`  Nom: ${user.fullName}`);
        console.log(`  Phone stocké: "${user.phone}"`);
        console.log(`  isActive: ${user.isActive}`);
        console.log(`  status: ${user.status}`);
        console.log(`  Hash: ${user.password.substring(0, 30)}...`);
        console.log(`\nTest mot de passe: "${test.expectedPwd}"`);
        console.log(`  Length: ${test.expectedPwd.length}`);
        console.log(`  Bytes (hex): ${Buffer.from(test.expectedPwd, 'utf8').toString('hex')}`);
        const isValid = await bcrypt.compare(test.expectedPwd, user.password);
        console.log(`  bcrypt.compare: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
        if (!isValid) {
            console.log('\n  Test variations:');
            const variations = [
                { name: 'trim', value: test.expectedPwd.trim() },
                { name: 'no-spaces', value: test.expectedPwd.replace(/\s+/g, '') },
                { name: 'lowercase', value: test.expectedPwd.toLowerCase() },
                { name: 'uppercase', value: test.expectedPwd.toUpperCase() },
            ];
            for (const variant of variations) {
                if (variant.value !== test.expectedPwd) {
                    const match = await bcrypt.compare(variant.value, user.password);
                    if (match) {
                        console.log(`    ✅ ${variant.name}: "${variant.value}" FONCTIONNE!`);
                    }
                }
            }
            console.log('\n  Test croisé (hash correspond à un autre mot de passe?):');
            for (const other of testCases) {
                if (other.phone !== test.phone) {
                    const crossMatch = await bcrypt.compare(other.expectedPwd, user.password);
                    if (crossMatch) {
                        console.log(`    ⚠️  TROUVÉ: Le hash correspond à "${other.expectedPwd}" (${other.name})`);
                        console.log(`    → Problème d'ordre d'insertion ou de mapping!`);
                    }
                }
            }
        }
    }
    console.log('\n=== FIN VERIFICATION ===\n');
    await prisma.$disconnect();
}
checkPasswords().catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
});
//# sourceMappingURL=check-passwords.js.map