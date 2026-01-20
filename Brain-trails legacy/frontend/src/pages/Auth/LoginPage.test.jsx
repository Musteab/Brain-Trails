import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LoginPage from './LoginPage';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

test('renders login form inputs', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
});
