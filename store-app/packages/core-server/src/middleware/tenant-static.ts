import { Router } from 'express';
import express from 'express';
import fs from 'fs';
import { requireTenant } from './require-context';

export const tenantStaticRouter = Router();

tenantStaticRouter.use(requireTenant);

/** فایل‌های آپلود مشتری: provisioned-sites/{slug}/uploads */
tenantStaticRouter.use('/uploads', (req, res, next) => {
  const uploadsDir = req.ctx!.uploadsDir;
  if (!fs.existsSync(uploadsDir)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  express.static(uploadsDir, { fallthrough: false, index: false })(req, res, next);
});
