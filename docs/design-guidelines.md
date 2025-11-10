# Design Guidelines - Attendance Processor Web

**Last Updated:** 2025-11-10
**Version:** 1.1.0

## Design System Overview

Attendance Processor Web follows **Neo Brutalism** design philosophy, characterized by bold borders, hard shadows, flat colors, and sharp edges. This creates a visually striking, modern interface that prioritizes clarity and functionality.

## Color Palette

### Primary Colors
```css
--nb-black: #000000   /* Primary text, borders */
--nb-white: #ffffff   /* Backgrounds, inverted text */
--nb-red: #ff3b30     /* Error, late status */
--nb-blue: #007aff    /* Primary actions, info */
--nb-green: #34c759   /* Success, on-time status */
--nb-yellow: #ffcc00  /* Warning, shift A */
--nb-orange: #ff9500  /* Accents */
--nb-purple: #af52de  /* Secondary actions, shift C */
--nb-pink: #ff2d92    /* Decorative accents */
```

### Analytics Chart Colors
```css
Late/Error:       #EF4444 (Red)
On-Time/Success:  #10B981 (Green)
Shift A:          #FACC15 (Yellow - Morning)
Shift B:          #3B82F6 (Blue - Afternoon)
Shift C:          #8B5CF6 (Purple - Night)
```

### Gray Scale
```css
--nb-gray-50:  #f9f9f9
--nb-gray-100: #f1f1f1
--nb-gray-200: #e8e8e8
--nb-gray-300: #d1d1d1
--nb-gray-400: #b3b3b3
--nb-gray-500: #8e8e93
--nb-gray-600: #636366
--nb-gray-700: #48484a
--nb-gray-800: #3a3a3c
--nb-gray-900: #1c1c1e
```

## Typography

### Font Families
- **Display:** Poppins (headings, titles)
- **Sans-serif:** Inter (body text, UI)
- **Monospace:** JetBrains Mono (code, data tables)

### Font Weights
- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700
- **Black:** 900 (headings, emphasis)

### Font Sizes (Responsive)
```css
xs:   clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)
sm:   clamp(0.875rem, 0.8rem + 0.375vw, 1rem)
base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)
lg:   clamp(1.125rem, 1rem + 0.625vw, 1.25rem)
xl:   clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)
2xl:  clamp(1.5rem, 1.3rem + 1vw, 2rem)
3xl:  clamp(2rem, 1.7rem + 1.5vw, 2.5rem)
4xl:  clamp(2.5rem, 2rem + 2.5vw, 3.5rem)
```

## Borders & Shadows

### Border Widths
```css
--nb-border-2: 2px  /* Subtle dividers */
--nb-border-4: 4px  /* Default, cards, buttons */
--nb-border-6: 6px  /* Emphasis */
--nb-border-8: 8px  /* Strong emphasis */
```

### Box Shadows (Hard Shadows)
```css
--shadow-nb-sm:  2px 2px 0px rgba(0,0,0,0.8)
--shadow-nb:     4px 4px 0px rgba(0,0,0,0.8)
--shadow-nb-lg:  6px 6px 0px rgba(0,0,0,0.8)
--shadow-nb-xl:  8px 8px 0px rgba(0,0,0,0.8)
--shadow-nb-2xl: 12px 12px 0px rgba(0,0,0,0.8)
```

### Border Radius
- **None:** 0 (default)
- **Small:** 2px (rare)
- **Base:** 4px (occasional)
- **Large:** 8px (rare, special cases)

**Note:** Neo Brutalism favors sharp corners (radius: 0).

## Spacing Scale

Based on **8px grid system**:
```css
--nb-space-1:  0.25rem (4px)
--nb-space-2:  0.5rem (8px)
--nb-space-3:  0.75rem (12px)
--nb-space-4:  1rem (16px)
--nb-space-5:  1.25rem (20px)
--nb-space-6:  1.5rem (24px)
--nb-space-8:  2rem (32px)
--nb-space-10: 2.5rem (40px)
--nb-space-12: 3rem (48px)
--nb-space-16: 4rem (64px)
--nb-space-20: 5rem (80px)
--nb-space-24: 6rem (96px)
--nb-space-32: 8rem (128px)
```

## Components

### Cards
```tsx
<Card variant="default | primary | secondary | success | warning | error">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

**Styling:**
- Background: White
- Border: 4px solid black
- Shadow: 6px 6px 0px black
- Padding: 24px
- Variant accent: 8px left border in variant color

### Buttons
```tsx
<Button variant="primary | secondary | success | warning | error" size="sm | md | lg">
  Button Text
</Button>
```

**Styling:**
- Border: 4px solid black
- Shadow: 4px 4px 0px black
- Font: Bold, uppercase
- Hover: Translate shadow (-2px, -2px)
- Active: No shadow, translate (4px, 4px)

### Badges
```tsx
<Badge variant="default | success | warning | error">
  Status
</Badge>
```

**Styling:**
- Border: 2px solid black
- Padding: 4px 12px
- Font: Bold, uppercase, 12px
- No shadow (small component)

### Charts (Recharts)

**General Styling:**
- Container: White background, 4px black border, 4px shadow
- Grid: Light gray dotted lines (strokeDasharray="3 3")
- Axes: Black, 3px stroke width
- Labels: Bold, uppercase, 12px
- Tooltips: White bg, 4px black border, 4px shadow

**Bar Charts:**
- Bars: 2px black stroke, solid fill
- Colors: Red (late), Green (on-time)

**Pie Charts:**
- Sectors: 3px black stroke, solid fill
- Labels: Percentage inside, bold
- Colors: Shift-specific (A: #FACC15 Yellow, B: #3B82F6 Blue, C: #8B5CF6 Purple)
- Legend: Bottom-aligned, no duplicate labels

**Line Charts:**
- Lines: 3px stroke width, monotone
- Dots: White fill, colored stroke, 5px radius
- Active dots: 7px radius
- User Colors: Bui Duc Toan (#3B82F6 Blue), Pham Tan Phat (#EF4444 Red), Mac Le Duc Minh (#10B981 Green), Nguyen Hoang Trieu (#F59E0B Amber)
- Dynamic rendering: Extract userNames from data, map to Line components

## Layout Patterns

### Responsive Grid
```css
/* Mobile first */
.grid-responsive {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

/* Tablet */
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Container
```css
.nb-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 640px) {
  .nb-container {
    padding: 0 32px;
  }
}
```

## Animation Principles

### Durations
```css
--nb-duration-fast: 150ms  /* Micro-interactions */
--nb-duration-base: 250ms  /* Default transitions */
--nb-duration-slow: 400ms  /* Complex animations */
```

### Easing Functions
```css
--nb-ease-in:     cubic-bezier(0.4, 0, 1, 1)
--nb-ease-out:    cubic-bezier(0, 0, 0.2, 1)
--nb-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--nb-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Keyframe Animations
- **Bounce In:** Scale 0.95 → 1.02 → 1.0
- **Press:** Translate Y +2px and back
- **Shake:** Translate X -4px, +4px, 0

**Usage:**
```css
.animate-nb-bounce-in { animation: nb-bounce-in 250ms ease-out; }
.animate-nb-press { animation: nb-press 150ms ease-in-out; }
.animate-nb-shake { animation: nb-shake 250ms ease-in-out; }
```

## Accessibility Guidelines

### Color Contrast
- **Normal text (16px):** Minimum 4.5:1
- **Large text (24px+):** Minimum 3:1
- **Interactive elements:** Minimum 3:1

### Focus States
```css
.nb-focus-visible:focus-visible {
  outline: 4px solid var(--nb-blue);
  outline-offset: 2px;
}
```

### ARIA Labels
- All interactive elements must have aria-label or aria-labelledby
- Charts must have role="img" and descriptive aria-label
- Tables must have caption or aria-label

### Keyboard Navigation
- All buttons/links tabbable (no tabindex="-1")
- Logical tab order follows visual hierarchy
- Enter/Space activate buttons
- Escape closes modals/dropdowns

## Data Visualization

### Chart Selection
- **Bar Chart:** Comparing values across categories (e.g., late % by user)
- **Pie Chart:** Part-to-whole relationships (e.g., shift distribution)
- **Line Chart:** Trends over time (e.g., attendance by date)
- **Table:** Precise numerical data (e.g., user statistics)

### Chart Responsiveness
```css
/* Desktop: 2x2 grid */
@media (min-width: 768px) {
  .analytics-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile: Stack vertically */
@media (max-width: 767px) {
  .analytics-grid { grid-template-columns: 1fr; }
}
```

### Chart Dimensions
- **Default height:** 300px
- **Full-width chart:** 400px height
- **Mobile:** Reduce height to 250px

### Color Assignment
- **Consistent colors:** Same user/category = same color across charts
- **Semantic colors:** Green (good), Red (bad), Yellow (caution)
- **Accessibility:** Avoid relying solely on color (use patterns/labels)
- **Implementation:** Use Record<string, string> mapping objects for explicit color assignment
  - Shift colors: SHIFT_COLORS constant with A/B/C keys
  - User colors: USER_COLORS constant with full user names as keys

## Form Design

### Input Fields
```tsx
<Input
  type="text | email | password"
  placeholder="Placeholder"
  error={errorMessage}
/>
```

**Styling:**
- Border: 4px solid black
- Padding: 12px 16px
- Font: 16px (prevent zoom on iOS)
- Error: Red border, red text below
- Focus: Blue outline, 2px offset

### File Upload
- Drag-and-drop area: Dashed border, hover state
- Selected file: Green border, file icon
- Error state: Red border, error message

## Status Indicators

### Status Colors
```tsx
On Time:  Green (#10B981)
Late:     Red (#EF4444)
Warning:  Yellow (#FACC15)
Info:     Blue (#3B82F6)
```

### Badge Variants
```tsx
Perfect:          Green (0% late)
Excellent:        Green (<10% late)
Good:             Yellow (10-25% late)
Needs Improve:    Red (>25% late)
```

## Implementation Guidelines

### CSS Classes
- Use Tailwind utility classes
- Prefix custom classes with `nb-` (e.g., `nb-container`)
- Avoid inline styles except for dynamic values

### Component Structure
```tsx
export default function Component({ data }: Props) {
  // 1. Validation/early returns
  if (!data) return null;

  // 2. Data transformations
  const transformed = transform(data);

  // 3. Render
  return (
    <div className="nb-container">
      {/* Content */}
    </div>
  );
}
```

### Naming Conventions
- **Files:** PascalCase (e.g., `AttendanceAnalytics.tsx`)
- **Components:** PascalCase (e.g., `AttendanceAnalytics`)
- **Functions:** camelCase (e.g., `calculateUserStats`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `USER_COLORS`)
- **CSS classes:** kebab-case (e.g., `nb-container`)

### TypeScript
- Always define interfaces for props
- Use explicit return types for functions
- Prefer `interface` over `type` for objects
- Export types from `types/` directory

## Testing Guidelines

### Component Tests
```tsx
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('renders with data', () => {
    render(<Component data={mockData} />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    const { container } = render(<Component data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

### Recharts Mocking
Mock Recharts components to avoid canvas/SVG issues:
```tsx
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  // ... other components
}));
```

### Coverage Goals
- **Statements:** >80%
- **Branches:** >70%
- **Functions:** >80%
- **Lines:** >80%

## Performance Optimization

### Chart Performance
- Limit data points: Max 100 for line charts, 50 for bar charts
- Use `ResponsiveContainer` for dynamic sizing
- Memoize chart data transformations with `useMemo`
- Lazy load analytics components

### Bundle Size
- Tree-shake unused Recharts components
- Use dynamic imports for large components
- Monitor bundle size: `npm run build`

### Rendering
- Avoid re-renders: Use `React.memo` for pure components
- Debounce expensive calculations
- Use `key` prop correctly in lists

## Documentation Requirements

### Component Documentation
```tsx
/**
 * Displays late percentage bar chart for all users
 *
 * @param data - Array of UserStats with late/on-time percentages
 * @returns Bar chart component or null if no data
 */
export default function LatePercentageChart({ data }: Props) {
  // ...
}
```

### Inline Comments
- Explain **why**, not **what**
- Document non-obvious logic
- Warn about edge cases
- Link to related issues/PRs

## File Organization

```
components/
  analytics/
    __tests__/
      AttendanceAnalytics.test.tsx
      LatePercentageChart.test.tsx
    AttendanceAnalytics.tsx
    LatePercentageChart.tsx
    AttendanceTrendsChart.tsx
    ShiftDistributionChart.tsx
    AttendanceSummaryTable.tsx
    index.ts

lib/
  analytics/
    __tests__/
      dataTransformers.test.ts
    dataTransformers.ts

types/
  attendance.ts (shared types)
```

## Future Enhancements

Potential additions (not implemented):
- Dark mode support
- Chart export (PNG/PDF)
- Interactive filters (date range, user selection)
- Real-time data updates
- Animated chart transitions
- Custom tooltips with detailed stats
- Downloadable reports (CSV/Excel)

---

## Changelog

### v1.1.0 (2025-11-10)
**Analytics Chart Fixes**

**ShiftDistributionChart.tsx:**
- Fixed color mapping with explicit SHIFT_COLORS constant
  - Shift A: #FACC15 (Yellow - Morning)
  - Shift B: #3B82F6 (Blue - Afternoon)
  - Shift C: #8B5CF6 (Purple - Night)
- Eliminated duplicate legend labels using consistent naming format
- Added manual legend with color swatches below chart

**AttendanceTrendsChart.tsx:**
- Fixed user display to show all 4 users (previously only showing 2)
- Implemented USER_COLORS constant with explicit mappings:
  - Bui Duc Toan: #3B82F6 (Blue)
  - Pham Tan Phat: #EF4444 (Red)
  - Mac Le Duc Minh: #10B981 (Green)
  - Nguyen Hoang Trieu: #F59E0B (Amber)
- Dynamic user extraction from data using Object.keys filtering
- Map-based line rendering ensures all users displayed

**Test Results:** ✅ All tests passed (150/150), TypeScript compiled, production build succeeded

---

**Maintained by:** Design Team
**Version:** 1.1.0
**Last Review:** 2025-11-10
