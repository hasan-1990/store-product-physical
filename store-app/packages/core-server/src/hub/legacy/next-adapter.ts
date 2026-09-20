import type { Request, Response } from 'express';
import { NextRequest } from 'next/server';

export function expressToNextRequest(req: Request): NextRequest {
  const host = req.get('host') || 'localhost';
  const protocol = req.protocol || 'http';
  const url = `${protocol}://${host}${req.originalUrl}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  if (req.cookies && Object.keys(req.cookies).length > 0 && !headers.has('cookie')) {
    headers.set(
      'cookie',
      Object.entries(req.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
    );
  }

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }

  return new NextRequest(url, init as any);
}

export async function pipeNextResponse(res: Response, nextRes: globalThis.Response): Promise<void> {
  res.status(nextRes.status);
  nextRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    res.setHeader(key, value);
  });

  if (nextRes.body) {
    const buffer = Buffer.from(await nextRes.arrayBuffer());
    res.send(buffer);
    return;
  }
  res.end();
}
