// scripts/hash-passwords.js
// Script para generar hashes de contraseñas para los usuarios

import bcrypt from 'bcryptjs';

/**
 * Script para generar hashes de contraseñas
 * Usar: node scripts/hash-passwords.js
 */

async function generateHashes() {
    const passwords = [
        { user: 'admin', password: 'password' },
        { user: 'editor', password: 'password' }
    ];

    console.log('🔒 Generando hashes de contraseñas...\n');

    for (const { user, password } of passwords) {
        const hash = await bcrypt.hash(password, 12);
        console.log(`Usuario: ${user}`);
        console.log(`Contraseña: ${password}`);
        console.log(`Hash: ${hash}`);
        console.log('---');
    }

    console.log('\n✅ Hashes generados correctamente.');
    console.log('📝 Copia estos hashes al archivo /src/data/admin-users.json');
}

// Función para hashear una contraseña específica
async function hashPassword(password) {
    if (!password) {
        console.log('❌ Uso: node scripts/hash-passwords.js [contraseña]');
        return;
    }

    const hash = await bcrypt.hash(password, 12);
    console.log(`Contraseña: ${password}`);
    console.log(`Hash: ${hash}`);
}

// Verificar si se pasó una contraseña como argumento
const customPassword = process.argv[2];

if (customPassword) {
    hashPassword(customPassword);
} else {
    generateHashes();
}