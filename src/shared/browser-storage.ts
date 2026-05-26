export interface BrowserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const noopStorage: BrowserStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export function getLocalStorage(): BrowserStorage {
  if (typeof window === 'undefined') {
    return noopStorage;
  }

  try {
    if (window.localStorage) {
      window.localStorage.setItem('__test__', '1');
      window.localStorage.removeItem('__test__');
      return window.localStorage;
    }
  } catch {
    // localStorage unavailable (e.g. jsdom)
  }

  return noopStorage;
}

export function getSessionStorage(): BrowserStorage {
  if (typeof window === 'undefined') {
    return noopStorage;
  }

  try {
    if (window.sessionStorage) {
      window.sessionStorage.setItem('__test__', '1');
      window.sessionStorage.removeItem('__test__');
      return window.sessionStorage;
    }
  } catch {
    // sessionStorage unavailable
  }

  return noopStorage;
}
