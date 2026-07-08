/**
 * Einfache Performance-Baseline für API und Container-Start.
 */
import fs from 'fs';
import path from 'path';

const artifactsDir = path.resolve(__dirname, '../../artifacts');
const apiBase = process.env.QA_API_BASE || 'http://localhost:3001/api';

async function measure(label: string, url: string): Promise<number> {
  const start = performance.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label} failed: ${res.status}`);
  return Math.round(performance.now() - start);
}

async function main(): Promise<void> {
  const results: Record<string, number> = {};
  results.healthMs = await measure('health', `${apiBase}/health`);
  results.publicMenuMs = await measure('menu', `${apiBase}/public/menu`);

  const mem = process.memoryUsage();
  results.heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);

  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(path.join(artifactsDir, 'performance.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(
    path.join(artifactsDir, 'performance-report.md'),
    `# Performance Report\n\n${Object.entries(results).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`
  );
  console.log(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
