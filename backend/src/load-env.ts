import { existsSync } from 'node:fs';

// Môi trường production nhận biến trực tiếp nên không có file .env
if (existsSync('.env')) process.loadEnvFile('.env');
