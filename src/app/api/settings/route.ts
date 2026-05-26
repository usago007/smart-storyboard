import { type NextRequest, NextResponse } from 'next/server';
import { SqliteSettingsRepository, runWithToken } from '@/infrastructure/remote/repositories';
import { resolveToken, setTokenCookie } from '@/infrastructure/remote/cookie';
import type { AppSettings } from '@/domain/storyboard';

const repo = new SqliteSettingsRepository();
const ALLOWED_PATCH_KEYS = new Set<keyof AppSettings>([
  'language',
  'theme',
  'mockDelayMs',
  'mockFailureRate',
]);

export async function GET(request: NextRequest) {
  const tokenState = resolveToken(request);

  try {
    const settings = await runWithToken(tokenState.token, () => repo.getSettings());
    const response = NextResponse.json({ success: true, data: settings });
    if (tokenState.shouldSetCookie) {
      setTokenCookie(response, tokenState.token);
    }
    return response;
  } catch (e) {
    const response = NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: (e as Error).message } },
      { status: 500 },
    );
    if (tokenState.shouldSetCookie) {
      setTokenCookie(response, tokenState.token);
    }
    return response;
  }
}

export async function PATCH(request: NextRequest) {
  const tokenState = resolveToken(request);

  let patch: Partial<AppSettings>;
  try {
    patch = await request.json();
  } catch {
    const response = NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } },
      { status: 400 },
    );
    if (tokenState.shouldSetCookie) {
      setTokenCookie(response, tokenState.token);
    }
    return response;
  }

  const patchKeys = Object.keys(patch) as Array<keyof AppSettings>;
  if (patchKeys.some((key) => !ALLOWED_PATCH_KEYS.has(key))) {
    const response = NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Patch contains unsupported fields' } },
      { status: 400 },
    );
    if (tokenState.shouldSetCookie) {
      setTokenCookie(response, tokenState.token);
    }
    return response;
  }

  try {
    const updated = await runWithToken(tokenState.token, () => repo.updateSettings(patch));
    const response = NextResponse.json({ success: true, data: updated });
    if (tokenState.shouldSetCookie) {
      setTokenCookie(response, tokenState.token);
    }
    return response;
  } catch (e) {
    const response = NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: (e as Error).message } },
      { status: 500 },
    );
    if (tokenState.shouldSetCookie) {
      setTokenCookie(response, tokenState.token);
    }
    return response;
  }
}
