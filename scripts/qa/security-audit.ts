/**
 * Security-Audit: npm audit + einfache Secret-Heuristik.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const artifactsDir = path.resolve(__dirname, '../../artifacts');
const root = path.resolve(__dirname, '../..');

interface AuditResult {
  package: string;
  high: number;
  moderate: number;
  low: number;
  exitCode: number;
}

function runAudit(cwd: string, label: string): AuditResult {
  const result = spawnSync('npm', ['audit', '--json'], { cwd, encoding: 'utf8' });
  let high = 0;
  let moderate = 0;
  let low = 0;
  try {
    const json = JSON.parse(result.stdout || '{}');
    const meta = json.metadata?.vulnerabilities;
    if (meta) {
      high = meta.high ?? 0;
      moderate = meta.moderate ?? 0;
      low = meta.low ?? 0;
    }
  } catch {
    // ignore parse errors
  }
  return { package: label, high, moderate, low, exitCode: result.status ?? 1 };
}

function scanSecrets(): string[] {
  const hits: string[] = [];
  const patterns = [
    /AKIA[0-9A-Z]{16}/,
    /sk_live_[0-9a-zA-Z]{24,}/,
    /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  ];
  const targets = ['backend/src', 'frontend/src', 'scripts'];
  for (const rel of targets) {
    const dir = path.join(root, rel);
    if (!fs.existsSync(dir)) continue;
    walk(dir, (file) => {
      if (!/\.(ts|tsx|js|json|env\.example)$/.test(file)) return;
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of patterns) {
        if (pattern.test(content)) hits.push(`${file}: mögliches Secret`);
      }
    });
  }
  return hits;
}

function walk(dir: string, fn: (file: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') walk(full, fn);
    else if (entry.isFile()) fn(full);
  }
}

function main(): void {
  fs.mkdirSync(artifactsDir, { recursive: true });
  const audits = [
    runAudit(path.join(root, 'backend'), 'backend'),
    runAudit(path.join(root, 'frontend'), 'frontend'),
  ];
  const secrets = scanSecrets();
  const report = {
    audits,
    secrets,
    failed: audits.some((a) => a.high > 0) || secrets.length > 0,
  };
  fs.writeFileSync(path.join(artifactsDir, 'security.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(artifactsDir, 'security-report.md'),
    `# Security Report\n\n${JSON.stringify(report, null, 2)}\n`
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.failed) process.exit(1);
}

main();
