# Attendance Processor Web

A modern web application for processing attendance data and converting CSV files. Built with Next.js 15, TypeScript, and Tailwind CSS featuring a Neo Brutalism design.

## Features

- **Attendance Processing**: Process biometric attendance data with advanced algorithms
- **CSV Converter**: Transform and convert CSV files with powerful processing capabilities
- **Burst Detection**: Consolidate multiple rapid swipes into single events
- **Shift Grouping**: Handle complex shift patterns including night shifts crossing midnight
- **Gap-Based Break Detection**: Intelligent break period identification
- **Real-time Processing**: Handle 10,000+ records in under 10 seconds
- **Modern UI**: Neo Brutalism design with responsive layout
- **API-First**: RESTful API endpoints for integration

## Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (or yarn/pnpm)
- **Memory**: Minimum 4GB RAM recommended
- **Storage**: 500MB free space for installation

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd attendance-processor-web
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment setup**
```bash
# Copy environment template (if exists)
cp .env.example .env.local

# Edit environment variables if needed
nano .env.local
```

4. **Start development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Access the application**
- Open [http://localhost:3000](http://localhost:3000) in your browser
- The application will auto-reload when you make changes

## Project Structure

```
attendance-processor-web/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API routes
│   │   └── v1/                   # API version 1
│   │       ├── processor/        # Attendance processing endpoints
│   │       ├── converter/        # CSV conversion endpoints
│   │       └── config/           # Configuration endpoints
│   ├── config/                   # Configuration management page
│   ├── converter/                # CSV converter page
│   ├── processor/                # Attendance processor page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # Reusable UI components
├── lib/                         # Core libraries and utilities
│   ├── processors/              # Processing algorithms
│   ├── config/                  # Configuration management
│   └── utils/                   # Utility functions
├── types/                       # TypeScript type definitions
├── public/                      # Static assets
├── docs/                        # Documentation
└── tests/                       # Test files
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting

# Testing
npm run test         # Run tests with coverage
npm run test:watch   # Run tests in watch mode
npm run test:ci      # Run tests for CI environments
```

## Configuration

The application uses YAML configuration files for business logic:

### Rule Configuration
- **Location**: `../rule.yaml` (in parent directory) or `./rule.yaml` (in project root)
- **Purpose**: Defines shift timings, break rules, and processing logic
- **Key sections**:
  - Shift definitions (Morning/Afternoon/Night)
  - Break detection parameters
  - Burst consolidation rules

### User Configuration
- **Location**: `../users.yaml` (in parent directory) or `./users.yaml` (in project root)
- **Purpose**: Maps user IDs to names and roles
- **Format**: YAML with user mappings

**Note**: The application will first check for configuration files in the project root, then fall back to the parent directory.

## API Documentation

### Endpoints

#### Attendance Processing
- `POST /api/v1/processor/process` - Process attendance data
- `GET /api/v1/processor/download/:id` - Download processed results

#### CSV Conversion
- `POST /api/v1/converter/process` - Convert CSV files
- `GET /api/v1/converter/download/:id` - Download converted files

#### Configuration
- `GET /api/v1/config/shifts` - Get shift configurations
- `GET /api/v1/config/users` - Get user mappings

### Request Format
```javascript
// For file uploads, use FormData
const formData = new FormData();
formData.append('file', file);
formData.append('options', JSON.stringify(options));

// Response format
{
  "success": true,
  "data": {
    "processedRecords": 150,
    "downloadId": "uuid-string",
    "summary": { ... }
  }
}
```

## Deployment

### Development Deployment

#### Windows Development
```powershell
# Using PowerShell
# Install Node.js (download from nodejs.org)
# Verify installation
node --version
npm --version

# Install dependencies
npm install

# Start development
npm run dev
```

#### Linux Development
```bash
# Using Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install dependencies
npm install

# Start development
npm run dev
```

### Production Deployment

#### Option 1: Using PM2 (Recommended for Windows)

1. **Install PM2 globally**
```bash
npm install -g pm2
```

2. **Build the application**
```bash
npm run build
```

3. **Create PM2 ecosystem file** (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'attendance-processor-web',
    script: 'npm',
    args: 'start',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

4. **Start with PM2**
```bash
# Create logs directory
mkdir logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### Option 2: Using systemd (Recommended for Linux)

1. **Build the application**
```bash
npm run build
```

2. **Create systemd service** (`/etc/systemd/system/attendance-processor-web.service`)
```ini
[Unit]
Description=Attendance Processor Web
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/attendance-processor-web
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

3. **Enable and start service**
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable attendance-processor-web

# Start service
sudo systemctl start attendance-processor-web

# Check status
sudo systemctl status attendance-processor-web
```

#### Option 3: Using Docker

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Build and run**
```bash
# Build image
docker build -t attendance-processor-web .

# Run container
docker run -p 3000:3000 --name attendance-processor-app attendance-processor-web
```

### Reverse Proxy Configuration

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache HTTP Server Configuration
```apache
# Enable required modules
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod rewrite
a2enmod headers

# Create virtual host configuration
# File: /etc/apache2/sites-available/attendance-processor.conf
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAdmin admin@your-domain.com

    # Enable WebSocket support for Next.js development
    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy WebSocket connections
    ProxyPass /_next/webpack-hmr http://localhost:3000/_next/webpack-hmr
    ProxyPassReverse /_next/webpack-hmr http://localhost:3000/_next/webpack-hmr

    # Proxy all requests to Next.js
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # WebSocket headers
    ProxyPassMatch ^/?(.*)$ http://localhost:3000/$1
    ProxyPassReverse / http://localhost:3000/

    # Additional headers for Next.js
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Host "localhost"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s
</VirtualHost>

# For HTTPS with SSL (using Certbot)
<VirtualHost *:443>
    ServerName your-domain.com
    ServerAdmin admin@your-domain.com

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf

    # Enable WebSocket support for Next.js development
    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy WebSocket connections
    ProxyPass /_next/webpack-hmr http://localhost:3000/_next/webpack-hmr
    ProxyPassReverse /_next/webpack-hmr http://localhost:3000/_next/webpack-hmr

    # Proxy all requests to Next.js
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # WebSocket headers
    ProxyPassMatch ^/?(.*)$ http://localhost:3000/$1
    ProxyPassReverse / http://localhost:3000/

    # Additional headers for Next.js
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Host "localhost"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s
</VirtualHost>

# Enable the site
sudo a2ensite attendance-processor.conf
sudo systemctl reload apache2
```

#### Apache Configuration with .htaccess (Shared Hosting)
```apache
# File: .htaccess in project root
RewriteEngine On

# Forward all requests to Next.js
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Set headers
RequestHeader set X-Forwarded-Proto "http"
RequestHeader set X-Forwarded-Host "localhost"
RequestHeader set X-Real-IP %{REMOTE_ADDR}s
```

### Firewall Configuration

#### Windows Firewall
```powershell
# Allow port 3000 inbound
New-NetFirewallRule -DisplayName "Attendance Processor Web" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow

# Allow specific IP range (optional)
New-NetFirewallRule -DisplayName "Attendance Processor Web - Office" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow -RemoteAddress 192.168.1.0/24
```

#### Linux Firewall (UFW)
```bash
# Allow port 3000
sudo ufw allow 3000/tcp

# Allow from specific IP range (optional)
sudo ufw allow from 192.168.1.0/24 to any port 3000

# Enable firewall
sudo ufw enable
```

## Monitoring and Maintenance

### Log Management
```bash
# PM2 logs
pm2 logs attendance-processor-web

# Systemd logs
sudo journalctl -u attendance-processor-web -f

# Application logs (if configured)
tail -f logs/combined.log
```

### Performance Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
iostat -x 1
```

### Backup Configuration
```bash
# Backup configuration files
cp ../rule.yaml ../rule.yaml.backup
cp ../users.yaml ../users.yaml.backup

# Backup application (regular)
tar -czf attendance-processor-web-$(date +%Y%m%d).tar.gz .
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
sudo lsof -i :3000
sudo kill -9 <PID>
```

#### Module Not Found
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### Permission Denied (Linux)
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or in package.json scripts
"start": "node --max-old-space-size=4096 server.js"
```

### Health Checks

#### Application Health
```bash
# Check if application is responding
curl http://localhost:3000/api/v1/health

# Check PM2 status
pm2 status

# Check systemd status
sudo systemctl status attendance-processor-web
```

#### Database/Configuration Health
```bash
# Validate YAML configuration
node -e "console.log(require('js-yaml').load(require('fs').readFileSync('../rule.yaml', 'utf8')))"

# Check file permissions
ls -la ../rule.yaml ../users.yaml
```

## Security Considerations

- File upload size limit: 10MB per file
- Input validation on all endpoints
- No PII storage in application logs
- Regular dependency updates recommended
- Use HTTPS in production (SSL/TLS)
- Implement rate limiting for API endpoints
- Regular security audits

## Development Guidelines

### Code Style
- Uses ESLint with Prettier configuration
- TypeScript strict mode enabled
- Husky hooks for pre-commit checks
- Conventional commits for git messages

### Testing
- Jest for unit testing
- React Testing Library for component testing
- Coverage target: >80%
- Tests run on CI/CD pipeline

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the [documentation](../docs/)
- Review the [troubleshooting section](#troubleshooting)
- See the [Deployment Guide](../docs/deployment-guide.md) for detailed setup instructions
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS**
