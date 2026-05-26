// @vitest-environment node

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { unlinkSync } from 'node:fs';
import { NextRequest } from 'next/server';
import { COOKIE_NAME } from '@/infrastructure/remote/cookie';

const TEST_DB_PATH = './data/test-api-routes.db';

function cleanupDbFiles() {
  try { unlinkSync(TEST_DB_PATH); } catch { /* ignore */ }
  try { unlinkSync(`${TEST_DB_PATH}-wal`); } catch { /* ignore */ }
  try { unlinkSync(`${TEST_DB_PATH}-shm`); } catch { /* ignore */ }
}

function buildRequest(url: string, init?: RequestInit) {
  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_DATA_MODE = 'remote';
  process.env.SQLITE_DB_PATH = TEST_DB_PATH;
  cleanupDbFiles();
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('/api/settings route', () => {
  it('sets a cookie on first GET and reuses it on PATCH', async () => {
    const { GET, PATCH } = await import('@/app/api/settings/route');

    const initialResponse = await GET(buildRequest('http://localhost:3000/api/settings') as never);
    const setCookie = initialResponse.headers.get('set-cookie');

    expect(initialResponse.status).toBe(200);
    expect(setCookie).toContain(`${COOKIE_NAME}=`);

    const cookie = setCookie!.split(';')[0];
    const patchResponse = await PATCH(buildRequest('http://localhost:3000/api/settings', {
      method: 'PATCH',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'en', theme: 'dark', mockDelayMs: 250, mockFailureRate: 15 }),
    }) as never);

    const patchJson = await patchResponse.json();
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.headers.get('set-cookie')).toBeNull();
    expect(patchJson.data.language).toBe('en');
    expect(patchJson.data.mockDelayMs).toBe(250);
    expect(patchJson.data.mockFailureRate).toBe(15);

    const secondGet = await GET(buildRequest('http://localhost:3000/api/settings', {
      headers: { Cookie: cookie },
    }) as never);
    const secondJson = await secondGet.json();
    expect(secondJson.data.theme).toBe('dark');
    expect(secondJson.data.mockDelayMs).toBe(250);
  });

  it('rejects invalid JSON and unsupported fields', async () => {
    const { PATCH } = await import('@/app/api/settings/route');

    const invalidJson = await PATCH(buildRequest('http://localhost:3000/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    }) as never);
    expect(invalidJson.status).toBe(400);

    const unsupportedField = await PATCH(buildRequest('http://localhost:3000/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bogus: true }),
    }) as never);
    expect(unsupportedField.status).toBe(400);

    const dataModePatch = await PATCH(buildRequest('http://localhost:3000/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataMode: 'mock' }),
    }) as never);
    expect(dataModePatch.status).toBe(400);
  });

  it('returns STORAGE_UNAVAILABLE when repository fails', async () => {
    const { SqliteSettingsRepository } = await import('@/infrastructure/remote/repositories');
    const { GET } = await import('@/app/api/settings/route');

    vi.spyOn(SqliteSettingsRepository.prototype, 'getSettings').mockRejectedValueOnce(new Error('boom'));

    const response = await GET(buildRequest('http://localhost:3000/api/settings') as never);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error.code).toBe('STORAGE_UNAVAILABLE');
  });
});

describe('/api/session route', () => {
  it('saves, loads, and clears a session with cookie reuse', async () => {
    const { GET, PUT, DELETE } = await import('@/app/api/session/route');

    const firstGet = await GET(buildRequest('http://localhost:3000/api/session?type=auto') as never);
    const cookie = firstGet.headers.get('set-cookie')!.split(';')[0];
    const firstGetJson = await firstGet.json();

    expect(firstGet.status).toBe(200);
    expect(firstGetJson.data).toBeNull();

    const payload = {
      script: 'remote script',
      duration: 10,
      wordCount: 89,
      scenes: [{ id: 1, name: '分镜1', dialogue: 'test', duration: 10 }],
    };

    const putResponse = await PUT(buildRequest('http://localhost:3000/api/session?type=auto', {
      method: 'PUT',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }) as never);
    const putJson = await putResponse.json();
    expect(putResponse.status).toBe(200);
    expect(putJson.data.script).toBe('remote script');

    const restoredResponse = await GET(buildRequest('http://localhost:3000/api/session?type=auto', {
      headers: { Cookie: cookie },
    }) as never);
    const restoredJson = await restoredResponse.json();
    expect(restoredJson.data.script).toBe('remote script');

    const deleteResponse = await DELETE(buildRequest('http://localhost:3000/api/session?type=auto', {
      method: 'DELETE',
      headers: { Cookie: cookie },
    }) as never);
    expect(deleteResponse.status).toBe(200);

    const afterDelete = await GET(buildRequest('http://localhost:3000/api/session?type=auto', {
      headers: { Cookie: cookie },
    }) as never);
    const afterDeleteJson = await afterDelete.json();
    expect(afterDeleteJson.data).toBeNull();
  });

  it('validates type and body', async () => {
    const { GET, PUT } = await import('@/app/api/session/route');

    const badType = await GET(buildRequest('http://localhost:3000/api/session?type=bad') as never);
    expect(badType.status).toBe(400);

    const badJson = await PUT(buildRequest('http://localhost:3000/api/session?type=auto', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    }) as never);
    expect(badJson.status).toBe(400);

    const missingFields = await PUT(buildRequest('http://localhost:3000/api/session?type=auto', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: 'x' }),
    }) as never);
    expect(missingFields.status).toBe(400);
  });
});

describe('/api/session/reset route', () => {
  it('resets fixture session and persists it for the same cookie', async () => {
    const { POST } = await import('@/app/api/session/reset/route');
    const sessionRoute = await import('@/app/api/session/route');

    const resetResponse = await POST(buildRequest('http://localhost:3000/api/session/reset?type=manual', {
      method: 'POST',
    }) as never);
    const cookie = resetResponse.headers.get('set-cookie')!.split(';')[0];
    const resetJson = await resetResponse.json();

    expect(resetResponse.status).toBe(200);
    expect(resetJson.data.sessionType).toBe('manual');

    const restored = await sessionRoute.GET(buildRequest('http://localhost:3000/api/session?type=manual', {
      headers: { Cookie: cookie },
    }) as never);
    const restoredJson = await restored.json();

    expect(restoredJson.data.sessionType).toBe('manual');
    expect(restoredJson.data.scenes.length).toBeGreaterThan(0);
  });
});
