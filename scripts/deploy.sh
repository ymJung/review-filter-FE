#!/bin/bash

# Deployment script for Review Platform
set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
check_env_vars() {
    local required_vars=(
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
        "FIREBASE_CLIENT_EMAIL"
        "OPENAI_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Error: $var is not set"
            exit 1
        fi
    done
    
    echo "✅ Environment variables check passed"
}

# Run tests before deployment
run_tests() {
    echo "🧪 Running tests..."
    
    # Unit tests
    npm run test:unit
    
    # Integration tests
    npm run test:integration
    
    # Type checking
    npm run type-check
    
    # Linting
    npm run lint
    
    echo "✅ All tests passed"
}

# Build the application
build_app() {
    echo "🔨 Building application..."
    
    # Clean previous build
    rm -rf .next
    
    # Build
    npm run build
    
    echo "✅ Build completed"
}

# Deploy Firebase rules and functions
deploy_firebase() {
    echo "🔥 Deploying Firebase configuration..."
    
    # Apply production rules
    if [ -f "firestore.rules.prod" ]; then
        echo "📋 Applying production Firestore rules..."
        cp firestore.rules.prod firestore.rules
    fi
    
    # Deploy Firestore rules
    firebase deploy --only firestore:rules --project $NEXT_PUBLIC_FIREBASE_PROJECT_ID
    
    # Deploy Storage rules
    firebase deploy --only storage:rules --project $NEXT_PUBLIC_FIREBASE_PROJECT_ID
    
    # Deploy Firestore indexes
    firebase deploy --only firestore:indexes --project $NEXT_PUBLIC_FIREBASE_PROJECT_ID
    
    echo "✅ Firebase deployment completed"
}

# Deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    
    # Deploy to production
    vercel --prod --yes
    
    echo "✅ Vercel deployment completed"
}

# Main deployment function
main() {
    echo "🌟 Review Platform Deployment"
    echo "=============================="
    
    # Check environment
    check_env_vars
    
    # Run tests
    if [ "${SKIP_TESTS:-false}" != "true" ]; then
        run_tests
    else
        echo "⚠️  Skipping tests (SKIP_TESTS=true)"
    fi
    
    # Build application
    build_app
    
    # Deploy Firebase
    if [ "${SKIP_FIREBASE:-false}" != "true" ]; then
        deploy_firebase
    else
        echo "⚠️  Skipping Firebase deployment (SKIP_FIREBASE=true)"
    fi
    
    # Deploy to Vercel
    deploy_vercel
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Your application should be available at your Vercel domain"
    echo ""
}

# Run main function
main "$@"