import { type NextRequest, NextResponse } from 'next/server';
import { SqliteSessionRepository, runWithToken } from '@/infrastructure/remote/repositories';
import { getOrSetToken } from '@/infrastructure/remote/cookie';
import type { SessionType, StoryboardSession } from '@/domain/storyboard';

const repo = new SqliteSessionRepository();

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

function parseType(request: NextRequest): SessionType | null {
  const type = request.nextUrl.searchParams.get('type');
  if (type === 'auto' || type === 'manual') {
    return type;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const token = getOrSetToken(request, response);

  const sessionType = parseType(request);
  if (!sessionType) {
    return err('INVALID_INPUT', 'Missing or invalid type parameter');
  }

  try {
    const session = await runWithToken(token, () => repo.loadSession(sessionType));
    if (!session) {
      return NextResponse.json({ success: true, data: null });
    }
    return ok(session);
  } catch (e) {
    return err('STORAGE_UNAVAILABLE', (e as Error).message, 500);
  }
}

export async function PUT(request: NextRequest) {
  const response = NextResponse.next();
  const token = getOrSetToken(request, response);

  const sessionType = parseType(request);
  if (!sessionType) {
    return err('INVALID_INPUT', 'Missing or invalid type parameter');
  }

  let body: Omit<StoryboardSession, 'sessionType' | 'updatedAt'>;
  try {
    body = await request.json();
  } catch {
    return err('INVALID_INPUT', 'Invalid JSON body');
  }

  if (!body.script || !body.duration || !body.scenes) {
    return err('INVALID_INPUT', 'Missing required fields: script, duration, scenes');
  }

  const session: StoryboardSession = {
    ...body,
    sessionType,
    updatedAt: new Date().toISOString(),
  };

  try {
    await runWithToken(token, () => repo.saveSession(session));
    return ok(session);
  } catch (e) {
    return err('STORAGE_UNAVAILABLE', (e as Error).message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.next();
  const token = getOrSetToken(request, response);

  const sessionType = parseType(request);

  try {
    await runWithToken(token, () => repo.clearSession(sessionType ?? undefined));
    return ok(null);
  } catch (e) {
    return err('STORAGE_UNAVAILABLE', (e as Error).message, 500);
  }
}
