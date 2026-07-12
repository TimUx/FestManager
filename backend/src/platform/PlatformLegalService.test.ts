import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database', () => ({
  prisma: {
    platformSettings: {
      findMany: vi.fn().mockResolvedValue([
        { key: 'platform.name', value: 'TestPlattform' },
        { key: 'platform.baseDomain', value: 'test.example' },
        { key: 'platform.contact.name', value: 'Max Mustermann' },
        { key: 'platform.contact.email', value: 'kontakt@test.example' },
        { key: 'platform.contact.address', value: 'Musterstraße 1, 12345 Musterstadt' },
      ]),
    },
    platformLegalPage: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([
        {
          slug: 'impressum',
          title: 'Impressum',
          pageType: 'impressum',
          contentHtml: '<p>Impressum</p>',
        },
      ]),
    },
  },
}));

import { prisma } from '../config/database';
import { platformLegalService } from './PlatformLegalService';
import {
  buildPlatformLegalTemplateContext,
  renderPlatformLegalTemplate,
} from './platformLegalTemplates';

describe('platformLegalTemplates', () => {
  it('fills context from platform settings', async () => {
    const ctx = await buildPlatformLegalTemplateContext();
    expect(ctx.platformName).toBe('TestPlattform');
    expect(ctx.operatorName).toBe('Max Mustermann');
    expect(ctx.operatorEmailRaw).toBe('kontakt@test.example');
    expect(ctx.baseDomain).toBe('test.example');
  });

  it('renders all legal page types with disclaimer', () => {
    const ctx = {
      platformName: 'FestSchmiede',
      operatorName: 'Betreiber GmbH',
      operatorAddress: 'Straße 1, 12345 Ort',
      operatorEmail: 'info@example.de',
      operatorEmailRaw: 'info@example.de',
      operatorPhone: '+49 123 456',
      website: 'https://www.example.de',
      baseDomain: 'example.de',
    };
    for (const pageType of ['impressum', 'datenschutz', 'nutzungsbedingungen'] as const) {
      const html = renderPlatformLegalTemplate(pageType, ctx);
      expect(html).toContain('Mustervorschlag');
      expect(html).toContain('FestSchmiede');
      expect(html).toContain('<h1>');
    }
  });
});

describe('platformLegalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ensureDefaults creates pages with example content', async () => {
    vi.mocked(prisma.platformLegalPage.findUnique).mockResolvedValue(null);
    await platformLegalService.ensureDefaults();
    expect(prisma.platformLegalPage.create).toHaveBeenCalledTimes(3);
    const firstCall = vi.mocked(prisma.platformLegalPage.create).mock.calls[0]?.[0];
    expect(firstCall?.data.contentHtml).toContain('Mustervorschlag');
    expect(firstCall?.data.published).toBe(false);
  });

  it('ensureDefaults backfills empty existing pages', async () => {
    vi.mocked(prisma.platformLegalPage.findUnique).mockResolvedValue({
      id: '1',
      pageType: 'impressum',
      title: 'Impressum',
      slug: 'impressum',
      enabled: true,
      published: false,
      contentHtml: '   ',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await platformLegalService.ensureDefaults();
    expect(prisma.platformLegalPage.update).toHaveBeenCalled();
    expect(prisma.platformLegalPage.create).not.toHaveBeenCalled();
  });

  it('listPublicLinks filters empty content', async () => {
    const links = await platformLegalService.listPublicLinks();
    expect(Array.isArray(links)).toBe(true);
    for (const link of links) {
      expect(link.slug).toBeTruthy();
      expect(link.title).toBeTruthy();
    }
  });
});
