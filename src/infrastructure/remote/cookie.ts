import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

const COOKIE_NAME = 'storyboard-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function getOrSetToken(request: NextRequest, response: NextResponse): string {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing) {
    return existing;
  }

  const token = randomUUID();
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return token;
}

export function getToken(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value ?? null;
}
