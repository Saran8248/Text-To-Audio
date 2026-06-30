import { render, screen } from '@testing-library/react';
import App from './App';

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('terra_tern_current_user', JSON.stringify(mockUser));
});

test('renders the application shell', () => {
  render(<App />);
  const linkElement = screen.getByText(/Terra Tern/i);
  expect(linkElement).toBeInTheDocument();
});

test.each([
  ['/', /Welcome back/i],
  ['/tts', /Text to Speech/i],
  ['/voices', /Voice Library/i],
  ['/history', /Generation History/i],
  ['/api-keys', /API Keys/i],
  ['/settings', /Settings/i],
])('renders route %s', (path, heading) => {
  window.history.pushState({}, '', path);
  render(<App />);
  expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
});
