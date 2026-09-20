import fs from 'fs-extra';
import path from 'path';
import { getInstancePath, getTemplatePath } from './config';

const SKIP_DIRS = new Set(['node_modules', '.next', '.git']);

async function copyRecursive(src: string, dest: string): Promise<void> {
  await fs.ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

export async function cloneTemplate(
  templateFolder: string,
  instanceSlug: string
): Promise<string> {
  const source = getTemplatePath(templateFolder);
  const dest = getInstancePath(instanceSlug);

  if (!(await fs.pathExists(source))) {
    throw new Error(`پوشه قالب یافت نشد: ${templateFolder}`);
  }

  if (await fs.pathExists(dest)) {
    throw new Error(`پوشه سایت از قبل وجود دارد: ${instanceSlug}`);
  }

  await copyRecursive(source, dest);
  return dest;
}

export async function listTemplateFolders(): Promise<string[]> {
  const root = getTemplatePath('');
  if (!(await fs.pathExists(root))) {
    await fs.ensureDir(root);
    return [];
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}
