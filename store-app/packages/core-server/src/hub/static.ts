import type { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { coreConfig } from '@core-shared';

const publicDir = path.join(coreConfig.storeAppRoot, 'public');

function hubOnlyStatic(root: string) {
  return express.static(root, { index: false, fallthrough: true });
}

function mountHubAssets(app: Express, urlPath: string, root: string): void {
  if (!fs.existsSync(root)) return;
  const handler = hubOnlyStatic(root);
  app.use(urlPath, (req: Request, res: Response, next: NextFunction) => {
    if (req.ctx?.type !== 'hub') return next();
    handler(req, res, next);
  });
}

/** فایل‌های استاتیک هاب — uploads و public (بدون UI الکی) */
export function registerHubStatic(app: Express): void {
  mountHubAssets(app, '/uploads', path.join(publicDir, 'uploads'));
  mountHubAssets(app, '/images', path.join(publicDir, 'images'));
  mountHubAssets(app, '/fonts', path.join(publicDir, 'fonts'));

  const staticHandler = hubOnlyStatic(publicDir);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.ctx?.type !== 'hub') return next();
    if (req.path.startsWith('/api/')) return next();
    staticHandler(req, res, next);
  });
}
