import type { Request, Response, NextFunction } from 'express';

export function requireHub(req: Request, res: Response, next: NextFunction): void {
  if (req.ctx?.type !== 'hub') {
    return next();
  }
  next();
}

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (req.ctx?.type !== 'tenant') {
    return next();
  }
  next();
}
