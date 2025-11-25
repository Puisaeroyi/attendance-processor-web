# Attendance Processor Web

Modern web application for processing biometric attendance data with optimized O(n) algorithms. Built with Next.js 15, TypeScript, and React 19.

## Key Features

- **O(n) Algorithm Performance**: Process 10,000 records in ~4.8 seconds (115x faster than Python)
- **Shift Detection**: Accurate detection with midnight-crossing support for night shifts
- **Break Detection**: Two-tier algorithm (gap-based + midpoint fallback)
- **Excel Processing**: Upload, process, and download formatted Excel files
- **Analytics Dashboard**: Real-time visualization with Recharts
- **Type-Safe**: Full TypeScript with strict mode

## Leave Management System

A comprehensive leave request management system integrated with Google Forms, featuring advanced data management capabilities.

### Core Features
- **Google Forms Integration**: Automatically sync leave requests from Google Forms
- **HR Dashboard**: Modern UI for managing leave requests with real-time updates
- **Approval Workflow**: Approve or deny leave requests with complete audit trail
- **Real-time Stats**: Dashboard with key metrics and analytics
- **Advanced Filtering**: Search and filter requests by status, employee, manager, type, and archival state
- **Soft Delete & Archive**: Safe deletion with 7-day grace period and archiving capabilities
- **Role-based Access Control**: Admin (archive/delete) and HR (archive only) permissions
- **Complete Audit Log**: Track all archive/delete operations with reasons and timestamps

### Advanced Data Management
- **Archive Functionality**: Hide requests from main view while preserving data
- **Soft Delete**: Remove requests with 7-day recovery period
- **Enhanced Filtering**: Show archived and deleted requests independently
- **Dashboard Statistics**: Real-time counts for archived and deleted requests
- **Confirmation Modals**: 4-step confirmation process for safety
- **Transaction Safety**: Atomic operations ensure data integrity
- **54 Comprehensive Tests**: 100% pass rate ensuring reliability

### API Endpoints
- `GET /api/v1/leave/requests` - List requests with archival/deletion filtering
- `POST /api/v1/leave/requests/{id}/archive` - Archive specific request
- `DELETE /api/v1/leave/requests/{id}/delete` - Soft delete request
- `POST /api/v1/leave/requests/{id}/unarchive` - Restore archived request
- `POST /api/v1/leave/requests/{id}/restore` - Restore deleted request (within 7 days)
- `POST /api/v1/leave/approve` - Approve leave requests
- `POST /api/v1/leave/deny` - Deny leave requests
- `GET /api/v1/leave/stats` - Dashboard statistics
- `POST /api/v1/leave/sync` - Manual Google Forms synchronization

### Database Schema
- **Soft Delete Fields**: `archivedAt`, `deletedAt`, `archivedBy`, `deletedBy`, `archiveReason`, `deleteReason`
- **Performance Indexes**: Optimized queries for archival and deletion operations
- **Migration**: `20251125171208_add_soft_delete_fields` for seamless upgrade

For detailed setup instructions, see [LEAVE_MANAGEMENT_README.md](./LEAVE_MANAGEMENT_README.md).

## Quick Start

### Prerequisites

- Node.js 18.0.0+
- npm 8.0.0+ (or yarn/pnpm)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd attendance-processor-web

# Install dependencies
npm install

# Start development server
npm run dev
```

Access at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
attendance-processor-web/
├── app/                    # Next.js App Router
│   ├── api/v1/            # RESTful API endpoints
│   │   ├── processor/     # Attendance processing
│   │   └── config/        # Configuration APIs
│   ├── processor/         # Processor page
│   ├── config/            # Config management page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI (Neo Brutalism)
│   ├── analytics/        # Charts & visualizations
│   └── layout/           # Layout components
├── lib/                  # Business logic
│   ├── processors/       # Core algorithms
│   │   ├── BurstDetector.ts    # O(n) burst detection
│   │   ├── ShiftDetector.ts    # O(n) shift detection
│   │   └── BreakDetector.ts    # Two-tier break detection
│   ├── config/           # YAML configuration loader
│   └── utils/            # Utility functions
├── types/                # TypeScript definitions
├── docs/                 # Documentation
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md
│   ├── code-standards.md
│   └── system-architecture.md
├── rule.yaml            # Business logic config (v10.0)
└── users.yaml           # User mappings
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run format:check # Check formatting

# Testing
npm test            # Run tests with coverage
npm run test:watch  # Run tests in watch mode
npm run test:ci     # Run tests for CI
```

## API Endpoints

### Processor API

**POST /api/v1/processor**
- Upload Excel file with biometric swipes
- Returns processed attendance records

**POST /api/v1/processor/download**
- Generate formatted Excel file
- Returns downloadable .xlsx file

### Configuration API

**GET /api/v1/config/shifts**
- Returns shift configurations from rule.yaml

**GET /api/v1/config/users**
- Returns user mappings from users.yaml

## Configuration

### rule.yaml (v10.0)

Defines business logic for attendance processing:
- Shift timings (Morning/Afternoon/Night)
- Break detection parameters
- Grace period rules
- Burst threshold (2 minutes)

### users.yaml

Maps usernames to employee IDs and display names:
```yaml
operators:
  Silver_Bui:
    id: "TPL0001"
    display_name: "Bui Van Bac"
    shifts: ["A", "B", "C"]
```

## Core Algorithms

### 1. Burst Detection (O(n))
Groups consecutive swipes within 2-minute threshold

**Example**:
```
Swipes: 10:00, 10:01:30, 10:01:55, 10:15:00
Result: Burst(10:00-10:01:55, 3 swipes), Burst(10:15:00, 1 swipe)
```

### 2. Shift Detection (O(n))
Detects shifts with pre-classification and assigned flags

**Key Fix** (Nov 2024): Prevents premature shift creation from overlapping ranges
- Before: 40 incorrect shifts (O(n²), 120+ seconds)
- After: 38 correct shifts (O(n), ~4.8 seconds)

### 3. Break Detection (Two-tier)
**Priority 1**: Gap-based (≥5min gaps)
**Priority 2**: Midpoint logic (fallback)

Independent selection for Break Time Out and Break Time In per rule.yaml v10.0

## Performance

| Records | Processing Time | Memory |
|---------|----------------|---------|
| 100 | ~50ms | ~50MB |
| 1,000 | ~500ms | ~80MB |
| 10,000 | ~4.8s | ~150MB |

**Speedup**: 115x faster than Python implementation (O(n²) → O(n))

## Testing

```bash
# Run all tests with coverage
npm test

# Coverage threshold: 80% (branches, functions, lines, statements)
```

**Test Structure**:
- Unit tests: Processors, utilities, config
- Integration tests: YAML loader with real files
- Component tests: React Testing Library

## Deployment

### Production Build

```bash
# Build application
npm run build

# Start production server
npm run start
```

### Docker (Planned)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
NODE_OPTIONS=--max-old-space-size=2048  # 2GB heap for large files
```

## Security

- File size limit: 10MB
- MIME type validation (.xls, .xlsx only)
- User authorization filtering
- Input sanitization
- No PII storage in logs
- TypeScript strict mode

## Recent Major Changes

### Algorithm Optimization (Nov 2024)
- Fixed shift detection logic (isDifferentShift)
- Optimized from O(n²) to O(n) complexity
- Corrected shift count: 40 → 38 shifts
- Performance: 120s → 4.8s (115x speedup)

### Break Detection Enhancement (Nov 2024)
- Independent gap selection for Break Time Out/In
- Break Time Out: closest to checkpoint (10:00)
- Break Time In: closest to grace period cutoff (10:34:59)

### Configuration Updates (Nov 2024)
- Extended check-in ranges (1 hour before shift start)
- Extended check-out ranges (2 hours after shift end)
- rule.yaml v10.0 specification

## Documentation

Comprehensive documentation available in `docs/`:

- **project-overview-pdr.md**: Product Development Requirements
- **codebase-summary.md**: Complete codebase structure analysis
- **code-standards.md**: Coding standards and best practices
- **system-architecture.md**: Architecture, algorithms, and API design

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19, Tailwind CSS 4
- **Charts**: Recharts 3.3.0
- **Excel**: ExcelJS 4.4.0
- **Config**: js-yaml 4.1.0
- **Testing**: Jest 30, React Testing Library 16
- **Linting**: ESLint 9, Prettier 3.6

## Known Limitations

- Single break per shift (multiple breaks not supported)
- Fixed 3-shift system (A/B/C)
- No overtime calculations
- No break duration validation

## Troubleshooting

### Port Already in Use
```bash
# Linux
sudo lsof -i :3000
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module Not Found
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Memory Issues
```bash
# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

Follow [Conventional Commits](https://www.conventionalcommits.org/) format.

## License

MIT License

## Support

- Documentation: `./docs/`
- Issues: GitHub Issues
- Contact: Development Team

---

**Built with ❤️ using Next.js 15, TypeScript, and React 19**
