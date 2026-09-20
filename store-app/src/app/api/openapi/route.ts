import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/openapi — مشخصات OpenAPI 3.0 (APIهای عمومی)
 */
export async function GET() {
  const specPath = path.join(process.cwd(), 'data', 'openapi.json');

  if (!fs.existsSync(specPath)) {
    return NextResponse.json({ error: 'OpenAPI spec not found' }, { status: 404 });
  }

  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
