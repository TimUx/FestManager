import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup';
import type { Express } from 'express';

describe('API /public/health', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('returns tenant or platform scope', async () => {
    const res = await request(app).get('/api/public/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(['tenant', 'platform']).toContain(res.body.scope);
    expect(res.body.timestamp).toBeDefined();
  });
});
