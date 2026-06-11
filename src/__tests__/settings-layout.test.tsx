import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import SettingsLayout from '@/app/(with-nav)/settings/layout';

const pushMock = vi.fn();
const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => usePathnameMock(),
}));

describe('SettingsLayout', () => {
  beforeEach(() => {
    pushMock.mockReset();
    usePathnameMock.mockReset();
  });

  it('pushes trailing-slash settings child routes', () => {
    usePathnameMock.mockReturnValue('/settings/');

    render(
      <SettingsLayout>
        <div>content</div>
      </SettingsLayout>,
    );

    fireEvent.click(screen.getByRole('button', { name: '数据' }));
    expect(pushMock).toHaveBeenCalledWith('/settings/database/');
  });

  it('treats the overview tab as active on the trailing-slash overview path', () => {
    usePathnameMock.mockReturnValue('/settings/');

    render(
      <SettingsLayout>
        <div>content</div>
      </SettingsLayout>,
    );

    expect(screen.getByRole('button', { name: '概览' }).className).toContain('text-gray-900');
  });
});
