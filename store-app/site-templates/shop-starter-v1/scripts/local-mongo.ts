import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, '.data');
const DB_PATH = path.join(DATA_DIR, 'mongodb');
const PID_FILE = path.join(DATA_DIR, 'mongod.pid');
const LOG_FILE = path.join(DATA_DIR, 'mongod.log');

function findMongod(): string | null {
  const fromEnv = process.env.MONGOD_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const versions = ['8.3', '8.0', '7.0', '6.0'];

  for (const version of versions) {
    const candidate = path.join(programFiles, 'MongoDB', 'Server', version, 'bin', 'mongod.exe');
    if (fs.existsSync(candidate)) return candidate;
  }

  try {
    const found = execSync('where mongod', { encoding: 'utf8' }).trim().split('\n')[0];
    if (found && fs.existsSync(found)) return found;
  } catch {
    // not in PATH
  }

  return null;
}

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function start() {
  const open = await isPortOpen(27017);
  if (open) {
    console.log('✅ MongoDB از قبل روی 127.0.0.1:27017 در حال اجراست.');
    return;
  }

  if (fs.existsSync(PID_FILE)) {
    const pid = Number(fs.readFileSync(PID_FILE, 'utf8'));
    if (pid && isProcessRunning(pid)) {
      console.log(`✅ MongoDB local در حال اجراست (PID ${pid}).`);
      return;
    }
    fs.unlinkSync(PID_FILE);
  }

  const mongod = findMongod();
  if (!mongod) {
    console.error('❌ mongod.exe پیدا نشد.');
    console.error('MongoDB Community Server را نصب کن:');
    console.error('  https://www.mongodb.com/try/download/community');
    console.error('یا مسیر را در .env.local بگذار: MONGOD_PATH=C:\\...\\mongod.exe');
    process.exit(1);
  }

  fs.mkdirSync(DB_PATH, { recursive: true });

  const child = spawn(
    mongod,
    ['--dbpath', DB_PATH, '--bind_ip', '127.0.0.1', '--port', '27017', '--logpath', LOG_FILE, '--logappend'],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );

  child.unref();
  fs.writeFileSync(PID_FILE, String(child.pid));

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isPortOpen(27017)) {
      console.log('✅ MongoDB local راه افتاد (کاملاً آفلاین، بدون Atlas).');
      console.log(`   آدرس: mongodb://127.0.0.1:27017/shop_template`);
      console.log(`   داده: ${DB_PATH}`);
      console.log(`   PID:  ${child.pid}`);
      return;
    }
  }

  console.error('❌ MongoDB بالا نیامد. لاگ را ببین:');
  console.error(`   ${LOG_FILE}`);
  process.exit(1);
}

function stop() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('MongoDB local در حال اجرا نیست (فایل PID نیست).');
    return;
  }

  const pid = Number(fs.readFileSync(PID_FILE, 'utf8'));
  if (!pid || !isProcessRunning(pid)) {
    fs.unlinkSync(PID_FILE);
    console.log('MongoDB local قبلاً متوقف شده بود.');
    return;
  }

  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    fs.unlinkSync(PID_FILE);
    console.log(`✅ MongoDB local متوقف شد (PID ${pid}).`);
  } catch {
    console.error('❌ خطا در توقف MongoDB. دستی: taskkill /PID', pid, '/F');
    process.exit(1);
  }
}

async function status() {
  const open = await isPortOpen(27017);
  const pid = fs.existsSync(PID_FILE) ? Number(fs.readFileSync(PID_FILE, 'utf8')) : null;
  console.log('Port 27017:', open ? 'باز ✅' : 'بسته ❌');
  if (pid) console.log('PID file:', pid, isProcessRunning(pid) ? '(فعال)' : '(غیرفعال)');
  console.log('Data path:', DB_PATH);
  console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop_template');
}

const cmd = process.argv[2] || 'start';

if (cmd === 'start') {
  void start();
} else if (cmd === 'stop') {
  stop();
} else if (cmd === 'status') {
  void status();
} else {
  console.log('Usage: npx tsx scripts/local-mongo.ts [start|stop|status]');
  process.exit(1);
}
