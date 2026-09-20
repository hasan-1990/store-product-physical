import path from 'path';
import { config as loadEnv } from 'dotenv';

const storeAppRoot = path.resolve(__dirname, '../../..');
loadEnv({ path: path.join(storeAppRoot, '.env.local') });
loadEnv({ path: path.join(storeAppRoot, '.env') });
