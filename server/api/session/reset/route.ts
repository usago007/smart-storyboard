import { type NextRequest, NextResponse } from 'next/server';
import { SqliteSessionRepository, runWithToken } from '@/infrastructure/remote/repositories';
import { getOrSetToken } from '@/infrastructure/remote/cookie';
import { buildFixtureSession } from '@/infrastructure/mock/fixtures';
import type { SessionType } from '@/domain/storyboard';

const repo = new SqliteSessionRepository();

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const token = getOrSetToken(request, response);

  const type = request.nextUrl.searchParams.get('type') as SessionType | null;
  if (type !== 'auto' && type !== 'manual') {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Missing or invalid type parameter' } },
      { status: 400 },
    );
  }

  try {
    const fixture = buildFixtureSession(type);
    await runWithToken(token, () => repo.saveSession(fixture));
    return NextResponse.json({ success: true, data: fixture });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: (e as Error).message } },
      { status: 500 },
    );
  }
}
