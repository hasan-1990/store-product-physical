import type { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import { pathToFileURL } from 'url';
import { coreConfig } from '@core-shared';
import { withHub } from '../middleware';
import { shouldSkipBridgeRoute } from './native-skip';
import { scanNextApiRoutes } from './route-scanner';
import { expressToNextRequest, pipeNextResponse } from './next-adapter';

const METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;
const METHOD_MAP = { get: 'GET', post: 'POST', put: 'PUT', delete: 'DELETE', patch: 'PATCH' } as const;

type RouteHandler = (
  req: import('next/server').NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<Response> | Response;

const handlerCache = new Map<string, Partial<Record<string, RouteHandler>>>();

async function loadHandlers(modulePath: string): Promise<Partial<Record<string, RouteHandler>>> {
  const cached = handlerCache.get(modulePath);
  if (cached) return cached;

  const mod = await import(pathToFileURL(modulePath).href);
  const handlers: Partial<Record<string, RouteHandler>> = {};
  for (const m of METHODS) {
    const key = METHOD_MAP[m];
    if (typeof mod[key] === 'function') handlers[m] = mod[key];
  }
  handlerCache.set(modulePath, handlers);
  return handlers;
}

function buildParams(req: Request): Record<string, string> {
  const params: Record<string, string> = { ...req.params };
  if (req.params['*slug']) {
    params.slug = req.params['*slug'];
  }
  return params;
}

export async function registerNextApiBridge(app: Express): Promise<number> {
  const apiRoot = path.join(coreConfig.storeAppRoot, 'src', 'app', 'api');
  const routes = scanNextApiRoutes(apiRoot);
  let count = 0;

  for (const route of routes) {
    const handlers = await loadHandlers(route.modulePath);
    const hasAny = METHODS.some((m) => handlers[m]);
    if (!hasAny) continue;

    for (const method of METHODS) {
      const handler = handlers[method];
      if (!handler) continue;
      if (shouldSkipBridgeRoute(route.expressPath, METHOD_MAP[method])) continue;

      app[method](
        route.expressPath,
        withHub(async (req, res, next) => {
          try {
            const nextReq = expressToNextRequest(req);
            const ctx = { params: Promise.resolve(buildParams(req)) };
            const nextRes = await handler(nextReq, ctx);
            await pipeNextResponse(res, nextRes);
          } catch (error) {
            console.error(`[next-api-bridge] ${method.toUpperCase()} ${route.expressPath}`, error);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Bridge handler error',
              });
            }
          }
        }),
      );
      count++;
    }
  }

  console.log(`[next-api-bridge] registered ${count} method handlers from ${routes.length} Next routes`);
  return count;
}

/** Fallback for any /api/* not matched by native or bridge routes */
export function registerApiNotFound(app: Express): void {
  app.use('/api', withHub((_req, res, next: NextFunction) => {
    if (res.headersSent) return next();
    res.status(404).json({ success: false, error: 'API route not found' });
  }));
}
