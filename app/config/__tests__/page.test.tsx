import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigPage from '../page';

// Mock components to simplify testing
jest.mock('@/components/config/UserManagementTab', () => {
  return function MockUserManagementTab({
    onNotification,
    isLoading,
    setIsLoading
  }: {
    onNotification: (type: 'success' | 'error', message: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
  }) {
    return (
      <div data-testid="user-management-tab">
        <p>User Management Tab</p>
        <button onClick={() => onNotification('success', 'Test notification')}>
          Test Notification
        </button>
      </div>
    );
  };
});

jest.mock('@/components/config/ShiftConfigTab', () => {
  return function MockShiftConfigTab({
    onNotification,
    isLoading,
    setIsLoading
  }: {
    onNotification: (type: 'success' | 'error', message: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
  }) {
    return (
      <div data-testid="shift-config-tab">
        <p>Shift Configuration Tab</p>
        <button onClick={() => onNotification('error', 'Test error')}>
          Test Error
        </button>
      </div>
    );
  };
});

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
  Card: ({ children, variant, className, ...props }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div className={className} data-variant={variant} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <h3 {...props}>{children}</h3>
  ),
  CardDescription: ({ children, ...props }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <p {...props}>{children}</p>
  ),
  CardContent: ({ children, ...props }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div {...props}>{children}</div>
  ),
  Badge: ({ children, variant, ...props }: {
    children?: React.ReactNode;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <span data-variant={variant} {...props}>{children}</span>
  ),
}));

describe('ConfigPage', () => {
  it('renders configuration manager page', () => {
    render(<ConfigPage />);

    expect(screen.getByText('Configuration Manager')).toBeInTheDocument();
    expect(screen.getByText('Manage users and shift settings for the attendance processor')).toBeInTheDocument();
  });

  it('shows user management tab by default', () => {
    render(<ConfigPage />);

    expect(screen.getByTestId('user-management-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('shift-config-tab')).not.toBeInTheDocument();
  });

  it('switches to shift configuration tab when clicked', async () => {
    render(<ConfigPage />);

    const shiftButton = screen.getByText('Shift Settings');
    await userEvent.click(shiftButton);

    expect(screen.getByTestId('shift-config-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('user-management-tab')).not.toBeInTheDocument();
  });

  it('shows active badge on selected tab', async () => {
    render(<ConfigPage />);

    // User management should have active badge initially
    const userBadge = screen.getByText('Active').closest('[data-variant="success"]');
    expect(userBadge).toBeInTheDocument();

    // Click shift settings
    const shiftButton = screen.getByText('Shift Settings');
    await userEvent.click(shiftButton);

    // Shift settings should now have active badge
    const shiftBadge = screen.getByText('Active').closest('[data-variant="success"]');
    expect(shiftBadge).toBeInTheDocument();
  });

  it('displays notification when child component calls it', async () => {
    render(<ConfigPage />);

    // Click test notification button in user management tab
    const testButton = screen.getByText('Test Notification');
    await userEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });
  });

  it('displays error notification when child component calls it', async () => {
    render(<ConfigPage />);

    // Switch to shift config tab
    const shiftButton = screen.getByText('Shift Settings');
    await userEvent.click(shiftButton);

    // Click test error button in shift config tab
    const testButton = screen.getByText('Test Error');
    await userEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  it('auto-dismisses notification after 5 seconds', async () => {
    jest.useFakeTimers();
    render(<ConfigPage />);

    const testButton = screen.getByText('Test Notification');
    await userEvent.click(testButton);

    // Notification should be visible
    expect(screen.getByText('Test notification')).toBeInTheDocument();

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('shows security notice section', () => {
    render(<ConfigPage />);

    expect(screen.getByText('Important Security Notice')).toBeInTheDocument();
    expect(screen.getByText(/Configuration changes are immediately applied/)).toBeInTheDocument();
    expect(screen.getByText(/Only authorized personnel should modify these settings/)).toBeInTheDocument();
  });
});