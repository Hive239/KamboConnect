import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AddToCalendar from './AddToCalendar';

describe('AddToCalendar', () => {
  it('renders the trigger button for a valid event', () => {
    render(<AddToCalendar event={{ title: 'Session', start: '2026-08-01T15:00:00.000Z' }} />);
    expect(screen.getByRole('button', { name: /add to calendar/i })).toBeInTheDocument();
  });

  it('renders nothing without a start date', () => {
    const { container } = render(<AddToCalendar event={{ title: 'Session', start: '' }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
