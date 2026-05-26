import { type NextRequest, NextResponse } from 'next/server';
import { SqliteSessionRepository, runWithToken } from '@/infrastructure/remote/repositories';
import { resolveToken, setTokenCookie } from '@/infrastructure/remote/cookie';
import { buildFixtureSession } from '@/infrastructure/mock/fixtures';
import type { SessionType } from '@/domain/storyboard';

const repo = new SqliteSessionRepository();

export async function POST(request: NextRequest) {
  const tokenState = resolveToken(request);

  const type = request.nextUrl.searchParams.get('type') as SessionType | null;
  if (type !== 'auto' && type !== 'manual') {
    const response = NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Missing or invalid type parameter' } },
      { status: 400 },
    );
    if (tokenState.shouldSetCookie) {
      setTokenCookie(response, tokenState.token);
    }
    return response;
  }

  try {
    const fixture = buildFixtureSession(type);
    await runWithToken(tokenState.token, () => repo.saveSession(fixture));
    const response = NextResponse.json({ success: true, data: fixture });
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
