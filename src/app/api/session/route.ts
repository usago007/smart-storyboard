import { type NextRequest, NextResponse } from 'next/server';
import { SqliteSessionRepository, runWithToken } from '@/infrastructure/remote/repositories';
import { resolveToken, setTokenCookie } from '@/infrastructure/remote/cookie';
import type { SessionType, StoryboardSession } from '@/domain/storyboard';

const repo = new SqliteSessionRepository();

function ok(data: unknown, tokenState?: { token: string; shouldSetCookie: boolean }) {
  const response = NextResponse.json({ success: true, data });
  if (tokenState?.shouldSetCookie) {
    setTokenCookie(response, tokenState.token);
  }
  return response;
}

function err(code: string, message: string, status = 400, tokenState?: { token: string; shouldSetCookie: boolean }) {
  const response = NextResponse.json({ success: false, error: { code, message } }, { status });
  if (tokenState?.shouldSetCookie) {
    setTokenCookie(response, tokenState.token);
  }
  return response;
}

function parseType(request: NextRequest): SessionType | null {
  const type = request.nextUrl.searchParams.get('type');
  if (type === 'auto' || type === 'manual') {
    return type;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const tokenState = resolveToken(request);

  const sessionType = parseType(request);
  if (!sessionType) {
    return err('INVALID_INPUT', 'Missing or invalid type parameter', 400, tokenState);
  }

  try {
    const session = await runWithToken(tokenState.token, () => repo.loadSession(sessionType));
    if (!session) {
      return ok(null, tokenState);
    }
    return ok(session, tokenState);
  } catch (e) {
    return err('STORAGE_UNAVAILABLE', (e as Error).message, 500, tokenState);
  }
}

export async function PUT(request: NextRequest) {
  const tokenState = resolveToken(request);

  const sessionType = parseType(request);
  if (!sessionType) {
    return err('INVALID_INPUT', 'Missing or invalid type parameter', 400, tokenState);
  }

  let body: Omit<StoryboardSession, 'sessionType' | 'updatedAt'>;
  try {
    body = await request.json();
  } catch {
    return err('INVALID_INPUT', 'Invalid JSON body', 400, tokenState);
  }

  if (!body.script || !body.duration || !Array.isArray(body.scenes)) {
    return err('INVALID_INPUT', 'Missing required fields: script, duration, scenes', 400, tokenState);
  }

  const session: StoryboardSession = {
    ...body,
    sessionType,
    updatedAt: new Date().toISOString(),
  };

  try {
    await runWithToken(tokenState.token, () => repo.saveSession(session));
    return ok(session, tokenState);
  } catch (e) {
    return err('STORAGE_UNAVAILABLE', (e as Error).message, 500, tokenState);
  }
}

export async function DELETE(request: NextRequest) {
  const tokenState = resolveToken(request);

  const sessionType = parseType(request);

  try {
    await runWithToken(tokenState.token, () => repo.clearSession(sessionType ?? undefined));
    return ok(null, tokenState);
  } catch (e) {
    return err('STORAGE_UNAVAILABLE', (e as Error).message, 500, tokenState);
  }
}
