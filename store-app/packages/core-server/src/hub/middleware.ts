import type { Request, Response, NextFunction } from 'express';
import type { HubRequestContext } from '@core-shared';
import { getHubUserFromRequest, type HubUser } from './auth';

export type HubRequest = Request & { ctx: HubRequestContext; user?: HubUser };

export function requireHubContext(req: Request, res: Response, next: NextFunction): void {
  if (req.ctx?.type !== 'hub') {
    return next();
  }
  next();
}

type HubHandler = (req: HubRequest, res: Response) => Promise<void>;

export function withHub(handler: HubHandler) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.ctx?.type !== 'hub') {
      return next();
    }
    try {
      await handler(req as HubRequest, res);
    } catch (error) {
      next(error);
    }
  };
}

export function withHubUser(handler: (req: HubRequest & { user: HubUser }, res: Response) => Promise<void>) {
  return withHub(async (req, res) => {
    const user = getHubUserFromRequest(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    await handler({ ...req, user }, res);
  });
}

export function withHubAdmin(
  handler: (req: HubRequest & { user: HubUser }, res: Response) => Promise<void>,
) {
  return withHubUser(async (req, res) => {
    if (req.user.role?.toLowerCase() !== 'admin') {
      res.status(403).json({ success: false, error: 'دسترسی غیرمجاز — فقط ادمین' });
      return;
    }
    await handler(req, res);
  });
}
