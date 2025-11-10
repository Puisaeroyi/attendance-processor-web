import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge Component', () => {
  it('renders badge with children', () => {
    render(<Badge>Badge Text</Badge>);
    expect(screen.getByText('Badge Text')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-nb-gray-100', 'text-nb-black');
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary')).toHaveClass('bg-nb-blue', 'text-nb-white');

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-nb-green', 'text-nb-white');

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-nb-yellow', 'text-nb-black');

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-nb-red', 'text-nb-white');
  });

  it('applies base brutalism styles', () => {
    const { container } = render(<Badge>Brutalist</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
    expect(badge).toHaveClass('border-nb-black');
    expect(badge).toHaveClass('shadow-nb-sm');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>Ref Badge</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders as span element', () => {
    const { container } = render(<Badge>Span Badge</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.tagName).toBe('SPAN');
  });

  it('supports additional HTML attributes', () => {
    render(
      <Badge data-testid="custom-badge" aria-label="Custom Badge">
        Test
      </Badge>
    );
    const badge = screen.getByTestId('custom-badge');
    expect(badge).toHaveAttribute('aria-label', 'Custom Badge');
  });
});
