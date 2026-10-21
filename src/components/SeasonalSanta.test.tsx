// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SeasonalSanta from './SeasonalSanta';

describe('SeasonalSanta', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the transparent character and can be dismissed', () => {
    vi.setSystemTime(new Date('2026-12-15T12:00:00.000Z'));
    render(<SeasonalSanta />);

    expect(screen.getByRole('img', { name: 'Dancing Father Christmas' })).toHaveAttribute('src', '/santa-dancing.svg');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Father Christmas' }));
    expect(screen.queryByRole('complementary', { name: 'Christmas greeting' })).not.toBeInTheDocument();
  });

  it('removes Santa at Lagos midnight while the page remains open', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-31T22:59:59.000Z'));
    render(<SeasonalSanta />);

    expect(screen.getByRole('complementary', { name: 'Christmas greeting' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.queryByRole('complementary', { name: 'Christmas greeting' })).not.toBeInTheDocument();
  });
});
