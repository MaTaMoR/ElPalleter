// Ejecutar en Node.js para generar hash
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
const password = 'q1ñ2w3e4r5t6y7u8i9o0p';
const hash = bcrypt.hashSync(password, 10);
console.log('Hash:', hash);