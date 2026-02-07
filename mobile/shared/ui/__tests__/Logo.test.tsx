/**
 * Unit tests for Logo component. Covers render, size, wordmark, and a11y.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/shared/config';
import { Logo } from '../Logo';

function wrap(ui: React.ReactElement) {
  return <ThemeProvider>{ui}</ThemeProvider>;
}

describe('Logo', () => {
  it('renders without wordmark by default', () => {
    render(wrap(<Logo />));
    expect(screen.queryByText('Balanço')).toBeNull();
  });

  it('renders wordmark when showWordmark is true', () => {
    render(wrap(<Logo showWordmark />));
    expect(screen.getByText('Balanço')).toBeOnTheScreen();
  });

  it('uses default accessibility label', () => {
    const { getByLabelText } = render(wrap(<Logo />));
    expect(getByLabelText('Balanço')).toBeOnTheScreen();
  });

  it('uses custom accessibility label when provided', () => {
    const { getByLabelText } = render(wrap(<Logo accessibilityLabel="App logo" />));
    expect(getByLabelText('App logo')).toBeOnTheScreen();
  });

  it('renders with custom size without crashing', () => {
    const { getByLabelText } = render(wrap(<Logo size={64} />));
    expect(getByLabelText('Balanço')).toBeOnTheScreen();
  });
});
