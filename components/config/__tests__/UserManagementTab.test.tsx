import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagementTab from '../UserManagementTab';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    type,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
    type?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      type={type}
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
  Input: ({ register, name, ...props }: {
    register?: (name: string) => { name: string };
    name?: string;
    [key: string]: unknown;
  }) => (
    <input {...(register ? register(name || '') : {})} {...props} />
  ),
  Badge: ({ children, variant, ...props }: {
    children?: React.ReactNode;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <span data-variant={variant} {...props}>{children}</span>
  ),
}));

describe('UserManagementTab', () => {
  const mockOnNotification = jest.fn();
  const mockSetIsLoading = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders user management interface', async () => {
    // Mock API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        data: {
          operators: {
            Silver_Bui: {
              output_name: 'Bui Duc Toan',
              output_id: 'TPL0001',
            },
            Capone: {
              output_name: 'Pham Tan Phat',
              output_id: 'TPL0002',
            },
          },
        },
      }),
    });

    render(
      <UserManagementTab
        onNotification={mockOnNotification}
        isLoading={false}
        setIsLoading={mockSetIsLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Current Users')).toBeInTheDocument();
      expect(screen.getByText('Manage system operators and their display information')).toBeInTheDocument();
      expect(screen.getByText('Bui Duc Toan')).toBeInTheDocument();
      expect(screen.getByText('Pham Tan Phat')).toBeInTheDocument();
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });
  });

  it('shows empty state when no users exist', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        data: { operators: {} },
      }),
    });

    render(
      <UserManagementTab
        onNotification={mockOnNotification}
        isLoading={false}
        setIsLoading={mockSetIsLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No users configured')).toBeInTheDocument();
      expect(screen.getByText('Click &quot;Add User&quot; to get started')).toBeInTheDocument();
    });
  });

  it('opens add user form when Add New User is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        data: { operators: {} },
      }),
    });

    render(
      <UserManagementTab
        onNotification={mockOnNotification}
        isLoading={false}
        setIsLoading={mockSetIsLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add New User');
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument(); // Form title
      expect(screen.getByDisplayValue('Enter full display name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Enter employee ID (e.g., TPL0001)')).toBeInTheDocument();
    });
  });

  it('allows adding a new user', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: Promise.resolve({
          success: true,
          data: { operators: {} },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: Promise.resolve({
          success: true,
          message: 'User added successfully',
        }),
      });

    render(
      <UserManagementTab
        onNotification={mockOnNotification}
        isLoading={false}
        setIsLoading={mockSetIsLoading}
      />
    );

    // Click Add User button
    await waitFor(() => {
      const addButton = screen.getByText('Add New User');
      userEvent.click(addButton);
    });

    // Fill out form
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter full display name')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter full display name');
    const idInput = screen.getByPlaceholderText('Enter employee ID (e.g., TPL0001)');

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John Doe');
    await userEvent.clear(idInput);
    await userEvent.type(idInput, 'TPL9999');

    // Submit form
    const saveButton = screen.getByText('Save User');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnNotification).toHaveBeenCalledWith('success', 'User added successfully');
    });
  });

  it('allows editing an existing user', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: Promise.resolve({
          success: true,
          data: {
            operators: {
              Silver_Bui: {
                output_name: 'Bui Duc Toan',
                output_id: 'TPL0001',
              },
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: Promise.resolve({
          success: true,
          message: 'User updated successfully',
        }),
      });

    render(
      <UserManagementTab
        onNotification={mockOnNotification}
        isLoading={false}
        setIsLoading={mockSetIsLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Bui Duc Toan')).toBeInTheDocument();
    });

    // Click Edit button
    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    // Should show edit form with current values
    await waitFor(() => {
      expect(screen.getByDisplayValue('Bui Duc Toan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TPL0001')).toBeInTheDocument();
    });

    // Modify name
    const nameInput = screen.getByDisplayValue('Bui Duc Toan');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Bui Duc Toan Updated');

    // Save changes
    const saveButton = screen.getByText('Save User');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnNotification).toHaveBeenCalledWith('success', 'User updated successfully');
    });
  });

  it('shows delete confirmation when delete button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        data: {
          operators: {
            Silver_Bui: {
              output_name: 'Bui Duc Toan',
              output_id: 'TPL0001',
            },
          },
        },
      }),
    });

    render(
      <UserManagementTab
        onNotification={mockOnNotification}
        isLoading={false}
        setIsLoading={mockSetIsLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Bui Duc Toan')).toBeInTheDocument();
    });

    // Click delete button (using the Trash2 icon button)
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument();
      expect(screen.getByText('Bui Duc Toan')).toBeInTheDocument();
      expect(screen.getByText('Username: Silver_Bui')).toBeInTheDocument();
      expect(screen.getByText('Yes, Delete User')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('validates form inputs correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: Promise.resolve({
        success: true,
        data: { operators: {} },
      }),
    });

    render(
      <UserManagementTab
        onNotification={mockOnNotification}
        isLoading={false}
        setIsLoading={mockSetIsLoading}
      />
    );

    // Click Add User button
    await waitFor(() => {
      const addButton = screen.getByText('Add New User');
      userEvent.click(addButton);
    });

    // Try to submit empty form
    await waitFor(() => {
      const saveButton = screen.getByText('Save User');
      userEvent.click(saveButton);
    });

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
      expect(screen.getByText('Employee ID is required')).toBeInTheDocument();
    });
  });
});