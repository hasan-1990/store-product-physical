import { hashPassword } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

export async function ensureDefaultAdmin() {
  const db = await connectDB();
  const email = (process.env.ADMIN_EMAIL || 'admin@muse.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await db.admins.findOne({ email });
  if (existing) return;

  const passwordHash = await hashPassword(password);
  await db.admins.insertOne({
    email,
    passwordHash,
    name: 'مدیر فروشگاه',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function findAdminByEmail(email: string) {
  const db = await connectDB();
  return db.admins.findOne({ email: email.toLowerCase() });
}
