import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UnauthorizedPage } from '../UnauthorizedPage';

describe('UnauthorizedPage', () => {
  const renderUnauthorizedPage = (state?: { from: { pathname: string } }) => {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/unauthorized', state }]}>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('renders access denied message', () => {
    renderUnauthorizedPage();
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
  });

  test('provides navigation options', () => {
    renderUnauthorizedPage();
    expect(screen.getByText(/go back/i)).toBeInTheDocument();
    expect(screen.getByText(/return to dashboard/i)).toBeInTheDocument();
  });

  test('preserves original navigation path', () => {
    const fromPath = '/protected-resource';
    renderUnauthorizedPage({ from: { pathname: fromPath } });
    const backLink = screen.getByText(/go back/i);
    expect(backLink).toHaveAttribute('href', fromPath);
  });

  test('defaults to dashboard when no previous path', () => {
    renderUnauthorizedPage();
    const backLink = screen.getByText(/go back/i);
    expect(backLink).toHaveAttribute('href', '/dashboard');
  });

  test('always shows dashboard link', () => {
    renderUnauthorizedPage();
    const dashboardLink = screen.getByText(/return to dashboard/i);
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  test('displays help message for users', () => {
    renderUnauthorizedPage();
    expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
  });
});