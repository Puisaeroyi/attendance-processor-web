#!/bin/bash

echo "🚀 Starting Attendance Processor Web Application..."

# Kill any existing processes on ports 3000-3002
echo "🔪 Stopping any existing servers..."
pkill -f "next dev" || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Clean caches to prevent build issues
echo "🧹 Deep cleaning caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/static

# Wait a moment for cleanup
sleep 2

# Verify YAML files exist
echo "📋 Checking configuration files..."
if [ ! -f "users.yaml" ]; then
    echo "⚠️  Warning: users.yaml not found"
fi

if [ ! -f "rule.yaml" ]; then
    echo "⚠️  Warning: rule.yaml not found"
fi

# Build to check for errors
echo "🔨 Building application..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - please check the errors above"
    exit 1
fi

# Start development server on port 3001 to avoid conflicts
echo "🌟 Starting development server on port 3001..."
npm run dev -- --port 3001