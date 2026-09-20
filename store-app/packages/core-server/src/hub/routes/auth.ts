import type { Express } from 'express';
import { z } from 'zod';
import { connectHubDb } from '@core-shared';
import { withHub, withHubUser } from '../middleware';
import { loginUser, registerUser, getUserProfile } from '../services/auth-users';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z
    .string()
    .min(11)
    .regex(/^09[0-9]{9}$/),
});

function zodError(res: import('express').Response, error: z.ZodError) {
  res.status(400).json({ success: false, error: 'داده‌های ورودی نامعتبر', details: error.issues });
}

export function registerHubAuthRoutes(app: Express): void {
  app.post(
    '/api/auth/login',
    withHub(async (req, res) => {
      try {
        const data = loginSchema.parse(req.body);
        const db = await connectHubDb();
        const result = await loginUser(db, data.email, data.password);
        if ('error' in result) {
          return res.status(result.status).json({ success: false, error: result.error });
        }
        res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.json({
          success: true,
          data: { user: result.user, token: result.token },
          message: 'ورود موفقیت‌آمیز بود',
        });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(500).json({ success: false, error: 'خطا در ورود' });
      }
    }),
  );

  app.post(
    '/api/auth/register',
    withHub(async (req, res) => {
      try {
        const data = registerSchema.parse(req.body);
        const db = await connectHubDb();
        const result = await registerUser(db, data);
        if ('error' in result) {
          return res.status(result.status).json({ success: false, error: result.error });
        }
        res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.json({
          success: true,
          data: { user: result.user, token: result.token },
          message: 'ثبت‌نام با موفقیت انجام شد',
        });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(500).json({ success: false, error: 'خطا در ثبت‌نام' });
      }
    }),
  );

  app.get(
    '/api/auth/check',
    withHub(async (req, res) => {
      const { getHubUserFromRequest } = await import('../auth');
      const user = getHubUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ success: false, authenticated: false, message: 'Not authenticated' });
      }
      res.json({
        success: true,
        authenticated: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }),
  );

  app.get(
    '/api/user/profile',
    withHubUser(async (req, res) => {
      const db = await connectHubDb();
      const profile = await getUserProfile(db, req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'کاربر یافت نشد' });
      }
      res.json({ success: true, user: profile });
    }),
  );
}
