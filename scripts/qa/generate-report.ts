/**
 * Erzeugt QA-Zusammenfassung aus vorhandenen Artefakten.
 */
import fs from 'fs';
import path from 'path';

const artifactsDir = path.resolve(__dirname, '../../artifacts');

interface SectionInput {
  name: string;
  file?: string;
  passed?: number;
  failed?: number;
  skipped?: number;
}

function readJson<T>(file: string): T | undefined {
  const full = path.join(artifactsDir, file);
  if (!fs.existsSync(full)) return undefined;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

async function main(): Promise<void> {
  const { QaReportBuilder } = await import('../../backend/src/platform/qa/QaReportBuilder');
  const builder = new QaReportBuilder();

  const sections: SectionInput[] = [
    { name: 'Codequalität', file: 'quality.json' },
    { name: 'Unit Tests', file: 'unit-tests.json' },
    { name: 'Modul-Szenarien', file: 'module-scenarios.json' },
    { name: 'API Tests', file: 'api-tests.json' },
    { name: 'E2E', file: 'e2e-results.json' },
    { name: 'Performance', file: 'performance.json' },
    { name: 'Security', file: 'security.json' },
  ];

  for (const section of sections) {
    if (section.file) {
      const data = readJson<unknown>(section.file);
      if (Array.isArray(data)) {
        const failed = data.filter((r: { ok?: boolean }) => r.ok === false).length;
        builder.addSection({
          name: section.name,
          passed: data.length - failed,
          failed,
          skipped: 0,
          details: data,
        });
        continue;
      }
      if (data && typeof data === 'object' && 'failed' in data) {
        const d = data as { passed?: number; failed?: number; skipped?: number };
        builder.addSection({
          name: section.name,
          passed: d.passed ?? 0,
          failed: d.failed ?? 0,
          skipped: d.skipped ?? 0,
          details: data,
        });
        continue;
      }
    }
    builder.addSection({
      name: section.name,
      passed: section.passed ?? 0,
      failed: section.failed ?? 0,
      skipped: section.skipped ?? 0,
    });
  }

  const coverage = readJson<{ total?: { lines?: { pct?: number } } }>('coverage/coverage-summary.json');
  const moduleScenarios = readJson<{ scenarioId: string; ok: boolean; label: string }[]>('module-scenarios.json');

  const report = builder.build(process.env.QA_WORKFLOW || 'quality-assurance');
  if (coverage?.total?.lines?.pct != null) {
    report.coverage = { lines: coverage.total.lines.pct };
  }
  if (moduleScenarios) {
    report.moduleScenarios = moduleScenarios.map((r) => ({
      scenarioId: r.scenarioId,
      ok: r.ok,
      label: r.label,
    }));
  }

  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(path.join(artifactsDir, 'qa-summary.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(artifactsDir, 'qa-summary.md'), builder.toMarkdown(report));
  console.log(builder.toMarkdown(report));

  if (!report.passed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
