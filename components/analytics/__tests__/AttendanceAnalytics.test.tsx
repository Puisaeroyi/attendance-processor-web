import { render, screen } from '@testing-library/react';
import AttendanceAnalytics from '../AttendanceAnalytics';
import { AttendanceRecord } from '@/types/attendance';

// Mock the recharts components to avoid canvas issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('AttendanceAnalytics', () => {
  const mockData: AttendanceRecord[] = [
    {
      date: new Date('2024-01-01'),
      id: '001',
      name: 'Silver_Bui',
      shift: 'A',
      checkIn: '08:00:00',
      breakOut: '12:00:00',
      breakIn: '13:00:00',
      checkOut: '17:00:00',
      checkInStatus: 'On Time',
      breakInStatus: 'On Time',
      totalHours: 8,
      overtime: 0,
    },
    {
      date: new Date('2024-01-01'),
      id: '002',
      name: 'Capone',
      shift: 'B',
      checkIn: '13:00:00',
      breakOut: '17:00:00',
      breakIn: '18:00:00',
      checkOut: '22:00:00',
      checkInStatus: 'Late',
      breakInStatus: 'On Time',
      totalHours: 8,
      overtime: 0,
    },
    {
      date: new Date('2024-01-02'),
      id: '003',
      name: 'Silver_Bui',
      shift: 'A',
      checkIn: '08:05:00',
      breakOut: '12:00:00',
      breakIn: '13:05:00',
      checkOut: '17:00:00',
      checkInStatus: 'Late',
      breakInStatus: 'Late',
      totalHours: 8,
      overtime: 0,
    },
    {
      date: new Date('2024-01-02'),
      id: '004',
      name: 'Minh',
      shift: 'C',
      checkIn: '22:00:00',
      breakOut: '02:00:00',
      breakIn: '03:00:00',
      checkOut: '07:00:00',
      checkInStatus: 'On Time',
      breakInStatus: 'On Time',
      totalHours: 8,
      overtime: 0,
    },
  ];

  it('renders analytics dashboard with title', () => {
    render(<AttendanceAnalytics data={mockData} />);
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('renders all chart components', () => {
    render(<AttendanceAnalytics data={mockData} />);
    expect(screen.getByText('Late Percentage by User')).toBeInTheDocument();
    // Shift Distribution and Attendance Trends charts removed per user request
  });

  it('renders summary table', () => {
    render(<AttendanceAnalytics data={mockData} />);
    expect(screen.getByText('User Performance Summary')).toBeInTheDocument();
  });

  it('displays correct summary statistics', () => {
    render(<AttendanceAnalytics data={mockData} />);
    expect(screen.getByText('4')).toBeInTheDocument(); // Total records
    expect(screen.getByText('Silver_Bui')).toBeInTheDocument();
    expect(screen.getByText('Capone')).toBeInTheDocument();
    expect(screen.getByText('Minh')).toBeInTheDocument();
  });

  it('returns null when no data provided', () => {
    const { container } = render(<AttendanceAnalytics data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays user stats correctly', () => {
    render(<AttendanceAnalytics data={mockData} />);
    // Check for specific user names in the table
    expect(screen.getByText('Silver_Bui')).toBeInTheDocument();
    expect(screen.getByText('Capone')).toBeInTheDocument();
    expect(screen.getByText('Minh')).toBeInTheDocument();
  });
});
