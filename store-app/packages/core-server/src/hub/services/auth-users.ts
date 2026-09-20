import bcrypt from 'bcryptjs';
import { ObjectId, type Db } from 'mongodb';
import { generateHubToken } from '../auth';

export function toPublicUser(user: Record<string, unknown>) {
  return {
    id: String(user._id),
    _id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin ?? null,
  };
}

export async function loginUser(db: Db, email: string, password: string) {
  const user = await db.collection('users').findOne({ email });
  if (!user) return { error: 'ایمیل یا رمز عبور اشتباه است', status: 401 as const };

  if (user.active === false || user.isActive === false) {
    return { error: 'حساب کاربری شما غیرفعال است', status: 401 as const };
  }

  const valid = await bcrypt.compare(password, String(user.password));
  if (!valid) return { error: 'ایمیل یا رمز عبور اشتباه است', status: 401 as const };

  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date(), updatedAt: new Date() } },
  );

  const userData = toPublicUser({ ...user, lastLogin: new Date().toISOString() });
  const token = generateHubToken(
    String(user._id),
    String(user.role || 'user'),
    String(user.email),
    String(user.name || ''),
  );

  return { user: userData, token };
}

export async function registerUser(
  db: Db,
  input: { name: string; email: string; password: string; phone: string },
) {
  const existing = await db.collection('users').findOne({ email: input.email });
  if (existing) return { error: 'این ایمیل قبلاً ثبت شده است', status: 400 as const };

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const userId = new ObjectId();
  const now = new Date();
  const userDoc = {
    _id: userId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    password: hashedPassword,
    role: 'USER',
    active: true,
    avatar: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('users').insertOne(userDoc);
  const userData = toPublicUser(userDoc);
  const token = generateHubToken(userId.toString(), 'USER', input.email, input.name);
  return { user: userData, token };
}

export async function getUserProfile(db: Db, userId: string) {
  const filter = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { _id: userId };
  const user = await db.collection('users').findOne(filter, { projection: { password: 0 } });
  if (!user) return null;
  return {
    _id: String(user._id),
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    nationalCode: user.nationalCode || '',
    role: user.role || 'USER',
    avatar: user.avatar || '',
    createdAt: user.createdAt || new Date().toISOString(),
    lastLogin: user.lastLogin || null,
  };
}
