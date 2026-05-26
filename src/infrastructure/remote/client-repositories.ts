import type { AppSettings, SessionType, StoryboardSession } from '@/domain/storyboard';
import type { ISessionRepository, ISettingsRepository } from '@/infrastructure/repository-interfaces';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body = await res.json();

  if (!body.success) {
    const err = body.error;
    throw new Error(err?.message || 'API request failed');
  }

  return body.data as T;
}

export class RemoteSettingsRepository implements ISettingsRepository {
  async getSettings(): Promise<AppSettings> {
    return apiFetch<AppSettings>('/api/settings');
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    return apiFetch<AppSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }
}

export class RemoteSessionRepository implements ISessionRepository {
  async loadSession(sessionType: SessionType): Promise<StoryboardSession | null> {
    return apiFetch<StoryboardSession | null>(`/api/session?type=${sessionType}`);
  }

  async saveSession(session: StoryboardSession): Promise<void> {
    await apiFetch(`/api/session?type=${session.sessionType}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    });
  }

  async clearSession(sessionType?: SessionType): Promise<void> {
    const qs = sessionType ? `?type=${sessionType}` : '';
    await apiFetch(`/api/session${qs}`, { method: 'DELETE' });
  }
}
