/**
 * Performance audit — baseline bundle + thresholds
 * Usage: npm run build && npm run perf:audit
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PERFORMANCE_THRESHOLDS } from '../src/modules/next-rocket/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const nextDir = path.join(root, '.next');

type ChunkInfo = { name: string; sizeKb: number };

function formatKb(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}

function collectBuildChunks(): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  const staticDir = path.join(nextDir, 'static', 'chunks');

  if (!fs.existsSync(staticDir)) {
    return chunks;
  }

  for (const file of fs.readdirSync(staticDir)) {
    if (!file.endsWith('.js')) continue;
    const stat = fs.statSync(path.join(staticDir, file));
    chunks.push({ name: file, sizeKb: formatKb(stat.size) });
  }

  return chunks.sort((a, b) => b.sizeKb - a.sizeKb);
}

function readBuildManifestSize(): number | null {
  const manifestPath = path.join(nextDir, 'build-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  return formatKb(fs.statSync(manifestPath).size);
}

function main() {
  console.log('📊 Performance Audit — Store App\n');

  if (!fs.existsSync(nextDir)) {
    console.error('❌ .next not found. Run: npm run build');
    process.exit(1);
  }

  const chunks = collectBuildChunks();
  const top10 = chunks.slice(0, 10);
  const totalJsKb = chunks.reduce((sum, c) => sum + c.sizeKb, 0);

  console.log('## Bundle (top 10 JS chunks)');
  if (top10.length === 0) {
    console.log('  (no chunks — run npm run build first)');
  } else {
    for (const chunk of top10) {
      console.log(`  ${chunk.sizeKb.toString().padStart(8)} KB  ${chunk.name}`);
    }
    console.log(`\n  Total JS chunks: ${chunks.length} — ~${Math.round(totalJsKb)} KB`);
  }

  const manifestKb = readBuildManifestSize();
  if (manifestKb !== null) {
    console.log(`  Build manifest: ${manifestKb} KB`);
  }

  console.log('\n## Core Web Vitals thresholds (Next Rocket)');
  console.log(`  LCP good: ≤ ${PERFORMANCE_THRESHOLDS.lcp.good}ms`);
  console.log(`  FCP good: ≤ ${PERFORMANCE_THRESHOLDS.fcp.good}ms`);
  console.log(`  CLS good: ≤ ${PERFORMANCE_THRESHOLDS.cls.good}`);

  console.log('\n## Recommended commands');
  console.log('  ANALYZE=true npm run build   # interactive bundle analyzer');
  console.log('  NEXT_ROCKET_ENABLED=true     # enable perf module on server');

  console.log('\n✅ perf-audit baseline recorded');
}

main();
