import fs from 'fs-extra';
import path from 'path';
import { getInstancePath } from './config';

export async function ensureInstanceUploads(slug: string): Promise<string> {
  const uploadsPath = path.join(getInstancePath(slug), 'uploads');
  await fs.ensureDir(uploadsPath);
  return uploadsPath;
}
