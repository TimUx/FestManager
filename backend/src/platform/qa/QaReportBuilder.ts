export interface QaReportSection {
  name: string;
  passed: number;
  failed: number;
  skipped: number;
  details?: unknown;
}

export interface QaSummaryReport {
  generatedAt: string;
  workflow: string;
  passed: boolean;
  sections: QaReportSection[];
  coverage?: { lines?: number; branches?: number; functions?: number; statements?: number };
  performance?: Record<string, number>;
  containerStatus?: Record<string, string>;
  moduleScenarios?: { scenarioId: string; ok: boolean; label: string }[];
}

export class QaReportBuilder {
  private readonly sections: QaReportSection[] = [];

  addSection(section: QaReportSection): void {
    this.sections.push(section);
  }

  build(workflow: string): QaSummaryReport {
    const failed = this.sections.reduce((sum, s) => sum + s.failed, 0);
    return {
      generatedAt: new Date().toISOString(),
      workflow,
      passed: failed === 0,
      sections: this.sections,
    };
  }

  toMarkdown(report: QaSummaryReport): string {
    const lines = [
      `# QA Report – ${report.workflow}`,
      ``,
      `**Datum:** ${report.generatedAt}`,
      `**Status:** ${report.passed ? '✅ BESTANDEN' : '❌ FEHLGESCHLAGEN'}`,
      ``,
      `## Zusammenfassung`,
      ``,
      `| Phase | Bestanden | Fehlgeschlagen | Übersprungen |`,
      `|-------|-----------|----------------|--------------|`,
    ];
    for (const s of report.sections) {
      lines.push(`| ${s.name} | ${s.passed} | ${s.failed} | ${s.skipped} |`);
    }
    if (report.moduleScenarios?.length) {
      lines.push(``, `## Modul-Szenarien`, ``);
      for (const m of report.moduleScenarios) {
        lines.push(`- ${m.ok ? '✅' : '❌'} ${m.label} (\`${m.scenarioId}\`)`);
      }
    }
    if (report.coverage) {
      lines.push(``, `## Coverage`, ``);
      lines.push(`- Lines: ${report.coverage.lines ?? '–'}%`);
      lines.push(`- Branches: ${report.coverage.branches ?? '–'}%`);
    }
    return lines.join('\n');
  }
}
