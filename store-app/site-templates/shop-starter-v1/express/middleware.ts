import type { Request, Response, NextFunction } from 'express';
import { getTenantDb } from '@core-shared';
import type { TenantRequestContext } from '@core-shared';

export const SHOP_STARTER_SLUG = 'shop-starter-v1';

export type TenantRequest = Request & { ctx: TenantRequestContext };

export function requireShopStarterTenant(
  req: Request,
  res: Response,
): req is TenantRequest {
  if (req.ctx?.type !== 'tenant') {
    res.status(400).json({ success: false, error: 'Tenant context required' });
    return false;
  }
  if (req.ctx.templateSlug !== SHOP_STARTER_SLUG) {
    res.status(404).json({ success: false, error: 'Template not available for this site' });
    return false;
  }
  return true;
}

type TenantHandler = (req: TenantRequest, res: Response) => Promise<void>;

export function withTenant(handler: TenantHandler) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!requireShopStarterTenant(req, res)) return;
    try {
      await handler(req as TenantRequest, res);
    } catch (error) {
      next(error);
    }
  };
}

export async function tenantDb(req: TenantRequest) {
  return getTenantDb(req.ctx.databaseName);
}
