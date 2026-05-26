import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export const COOKIE_NAME = 'storyboard-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function resolveToken(request: NextRequest): { token: string; shouldSetCookie: boolean } {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing) {
    return { token: existing, shouldSetCookie: false };
  }

  return {
    token: randomUUID(),
    shouldSetCookie: true,
  };
}

export function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export function getToken(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value ?? null;
}
