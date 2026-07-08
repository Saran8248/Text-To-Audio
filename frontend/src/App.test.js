import { render, screen } from '@testing-library/react';
import App from './App';
import axios from 'axios';

jest.mock('axios');

const mockUser = {
  id: 1,
  name: 'Saran',
  email: 'sksaran987@gmail.com',
  password: 'Sarankd@987',
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('terra_tern_current_user', JSON.stringify(mockUser));
  axios.get.mockImplementation((url) => {
    if (url.includes('/api/stats')) {
      return Promise.resolve({
        data: {
          historyEntries: 0,
          cacheFiles: 0,
          successCount: 0,
          failureCount: 0,
          genderCounts: { male: 0, female: 0, other: 0 },
          languageCounts: {},
        },
      });
    }

    if (url.includes('/api/tts/history')) {
      return Promise.resolve({ data: { data: [] } });
    }

    return Promise.resolve({ data: {} });
  });
});

test('renders the application shell', async () => {
  render(<App />);
  const linkElement = await screen.findByText(/Terra Tern/i);
  expect(linkElement).toBeInTheDocument();
});

test.each([
  ['/', /Welcome back/i],
  ['/tts', /Text to Speech/i],
  ['/voices', /Voice Library/i],
  ['/history', /Generation History/i],
  ['/settings', /Settings/i],
])('renders route %s', async (path, heading) => {
  window.history.pushState({}, '', path);
  render(<App />);
  expect(await screen.findByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
});
