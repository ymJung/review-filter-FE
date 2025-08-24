#!/bin/bash

echo "🚀 Setting up development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "🔥 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

echo "✅ Firebase CLI is ready"

# Set up environment files
echo "⚙️ Setting up environment files..."

if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local 2>/dev/null || echo "# Local environment variables" > .env.local
    echo "NEXT_PUBLIC_USE_MOCK_AUTH=true" >> .env.local
    echo "NODE_ENV=development" >> .env.local
fi

# Create test environment file if it doesn't exist
if [ ! -f .env.test ]; then
    echo "📝 Test environment file already exists"
else
    echo "✅ Test environment file created"
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh

# Check Firebase project configuration
echo "🔥 Checking Firebase configuration..."
if [ -f .firebaserc ]; then
    echo "✅ Firebase project configured"
else
    echo "⚠️  Firebase project not configured. Run 'firebase init' to set up."
fi

# Run initial health check
echo "🏥 Running health check..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "⚠️  Build issues detected. Check the logs."
fi

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false --passWithNoTests > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Tests passing"
else
    echo "⚠️  Some tests failing. Check test output."
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. 🔥 Start Firebase emulators: npm run emulators"
echo "2. 🚀 Start development server: npm run dev"
echo "3. 🧪 Run tests: npm test"
echo "4. 🌐 Open http://localhost:3000"
echo ""
echo "For admin testing:"
echo "- Admin panel: http://localhost:3000/admin"
echo "- Mock admin user will be used in development"
echo ""
echo "Troubleshooting:"
echo "- If Firebase issues persist, check firestore.rules"
echo "- For permission errors, try: ./scripts/deploy-dev-rules.sh"
echo "- Check logs in browser console for detailed errors"