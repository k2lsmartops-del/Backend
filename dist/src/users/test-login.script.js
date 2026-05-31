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
async function testLogin(phone, password) {
    console.log('\n=== DIAGNOSTIC LOGIN ===');
    console.log(`Phone: "${phone}"`);
    console.log(`Password fourni: "${password}"`);
    console.log(`Length password: ${password.length}`);
    console.log(`Password bytes: [${Array.from(password).map(c => c.charCodeAt(0)).join(', ')}]`);
    try {
        const user = await prisma.user.findFirst({
            where: { phone },
            select: {
                id: true,
                matricule: true,
                fullName: true,
                phone: true,
                password: true,
                isActive: true,
                status: true,
                role: true,
            },
        });
        if (!user) {
            console.log('\n❌ ÉCHEC: Utilisateur non trouvé avec ce téléphone');
            return;
        }
        console.log('\n✅ Utilisateur trouvé:');
        console.log(`  - Matricule: ${user.matricule}`);
        console.log(`  - Nom: ${user.fullName}`);
        console.log(`  - Role: ${user.role}`);
        console.log(`  - Status: ${user.status}`);
        console.log(`  - isActive: ${user.isActive}`);
        console.log(`  - Hash stocké: ${user.password.substring(0, 20)}...`);
        if (!user.isActive) {
            console.log('\n❌ ÉCHEC: Compte désactivé');
            return;
        }
        if (user.status !== 'ACTIF') {
            console.log(`\n❌ ÉCHEC: Statut = ${user.status} (attendu: ACTIF)`);
            return;
        }
        console.log('\n--- Test bcrypt.compare ---');
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`Résultat: ${isValid ? '✅ MATCH' : '❌ PAS DE MATCH'}`);
        if (!isValid) {
            console.log('\n--- Test variations du mot de passe ---');
            const variations = [
                password.trim(),
                password.replace(/\s+/g, ''),
                password.normalize('NFC'),
                password.normalize('NFD'),
            ];
            for (const variant of variations) {
                if (variant !== password) {
                    const match = await bcrypt.compare(variant, user.password);
                    console.log(`  "${variant}" (length=${variant.length}): ${match ? '✅ MATCH' : '❌'}`);
                    if (match) {
                        console.log(`\n⚠️  TROUVÉ: Le mot de passe correct est "${variant}"`);
                        console.log(`   Différence avec l'original: probablement des espaces ou caractères invisibles`);
                        return;
                    }
                }
            }
            console.log('\n--- Vérification du hash ---');
            const newHash = await bcrypt.hash(password, 12);
            console.log(`Hash généré maintenant: ${newHash.substring(0, 20)}...`);
            const testNewHash = await bcrypt.compare(password, newHash);
            console.log(`Test avec nouveau hash: ${testNewHash ? '✅' : '❌'}`);
            console.log('\n❌ CONCLUSION: Le mot de passe stocké ne correspond pas au mot de passe fourni.');
            console.log('   Causes possibles:');
            console.log('   1. Mot de passe incorrect saisi lors de l\'import Excel');
            console.log('   2. Caractères invisibles/espaces dans le fichier Excel');
            console.log('   3. Encodage différent (UTF-8 vs autre)');
            console.log('   4. Le mot de passe a été modifié après l\'import');
        }
        else {
            console.log('\n✅ SUCCÈS: Authentification réussie!');
        }
    }
    catch (error) {
        console.error('\n❌ ERREUR:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: npx ts-node src/users/test-login.script.ts <phone> <password>');
    console.error('Exemple: npx ts-node src/users/test-login.script.ts 0700000002 Passw0rd2');
    process.exit(1);
}
const [phone, password] = args;
testLogin(phone, password);
//# sourceMappingURL=test-login.script.js.map