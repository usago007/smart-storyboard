import { type NextRequest, NextResponse } from 'next/server';
import { SqliteSettingsRepository, runWithToken } from '@/infrastructure/remote/repositories';
import { getOrSetToken } from '@/infrastructure/remote/cookie';
import type { AppSettings } from '@/domain/storyboard';

const repo = new SqliteSettingsRepository();

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const token = getOrSetToken(request, response);

  try {
    const settings = await runWithToken(token, () => repo.getSettings());
    return NextResponse.json({ success: true, data: settings });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: (e as Error).message } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const response = NextResponse.next();
  const token = getOrSetToken(request, response);

  let patch: Partial<AppSettings>;
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  try {
    const updated = await runWithToken(token, () => repo.updateSettings(patch));
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: (e as Error).message } },
      { status: 500 },
    );
  }
}
