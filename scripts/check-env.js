import dotenv from 'dotenv';
dotenv.config();

console.log('=== Verificando variables de entorno ===');
console.log('');
console.log('STRIPE_SECRET_KEY:');
console.log('  - Existe:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - Longitud:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);
console.log('  - Primeros 25 caracteres:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 25) + '...' : 'N/A');
console.log('');
console.log('STRIPE_WEBHOOK_SECRET:');
console.log('  - Existe:', !!process.env.STRIPE_WEBHOOK_SECRET);
console.log('  - Longitud:', process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.length : 0);

